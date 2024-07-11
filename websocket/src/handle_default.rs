use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use lambda_runtime::Error;
use time::Duration;
mod get_data;
mod send_data;
use crate::utils;
use tokio::{sync::mpsc, time::Duration as TokioDuration};
use websocket::WebSocketMessage;
mod send_price_array;

fn parse_request_body(body: &Option<String>) -> Result<WebSocketMessage, Error> {
    match body {
        Some(body) => serde_json::from_str(body)
            .map_err(|e| Error::from(format!("Failed to deserialize request data: {}", e))),
        None => Err(Error::from("Missing body in the request")),
    }
}

pub async fn handle_default(
    event: ApiGatewayWebsocketProxyRequest,
) -> Result<ApiGatewayProxyResponse, Error> {
    let duration = 5;

    let domain_name = event
        .request_context
        .domain_name
        .as_deref()
        .unwrap_or_default();
    let connection_id = event
        .request_context
        .connection_id
        .as_deref()
        .unwrap_or_default()
        .to_string();
    let stage = event.request_context.stage.as_deref().unwrap_or_default();

    println!(
        "Parsed event details: domain_name={}, connection_id={}, stage={}",
        domain_name, connection_id, stage
    );

    let message: WebSocketMessage = parse_request_body(&event.body)?;

    if let WebSocketMessage::Subscribe { data } = message {
        let (replay_time, instrument, exchange) =
            (data.replay_time, data.instrument, data.exchange);
        let instrument_with_suffix = format!("{}.C.0", instrument);
        let replay_start = utils::parse_replay_time(&replay_time)?;

        let apigateway_client = utils::create_apigateway_client(domain_name, stage).await?;
        send_price_array::send_price_array(
            &apigateway_client,
            &connection_id,
            replay_start,
            &instrument_with_suffix,
            &exchange,
        )
        .await?;

        let (message_tx, mut message_rx) = mpsc::channel(100);

        tokio::spawn(async move {
            let mut replay_start = utils::parse_replay_time(&replay_time).unwrap();
            let mut loop_count = 0;
            const MAX_LOOPS: usize = 12;

            while loop_count < MAX_LOOPS {
                let replay_end = replay_start + Duration::seconds(duration);

                if let Err(e) = get_data::get_data(
                    replay_start,
                    replay_end,
                    &instrument_with_suffix,
                    &exchange,
                    message_tx.clone(),
                )
                .await
                {
                    log::error!("Error in get_data: {:?}", e);
                    break;
                }

                message_tx.send((0, "FirstDataReady".to_string())).await.unwrap();

                replay_start = replay_end;
                tokio::time::sleep(TokioDuration::from_secs(5)).await;
                loop_count += 1;
            }
        });

        // Spawn task for sending data
        tokio::spawn(async move {
            // Wait for the signal that the first get_data is complete
            while let Some((_, msg)) = message_rx.recv().await {
                if msg == "FirstDataReady" {
                    // First get_data is complete, start send_data
                    if let Err(e) = send_data::send_data(
                        &apigateway_client,
                        &connection_id,
                        message_rx,
                        replay_start,
                    )
                    .await
                    {
                        log::error!("Error in send_data: {:?}", e);
                    }
                    break;
                }
            }
        });
    }

    Ok(utils::create_response())
}
