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

        let (message_tx, message_rx) = mpsc::channel(100);

        tokio::spawn(async move {
            let mut current_time = replay_start;
            let end_time = replay_start + Duration::minutes(1); // Adjust as needed
            let chunk_duration = Duration::seconds(5);
            let mut next_fetch_time = current_time;

            while current_time < end_time {
                if current_time >= next_fetch_time {
                    let chunk_end = next_fetch_time + chunk_duration;

                    if let Err(e) = get_data::get_data(
                        next_fetch_time,
                        chunk_end,
                        &instrument_with_suffix,
                        &exchange,
                        message_tx.clone(),
                    )
                    .await
                    {
                        log::error!("Error in get_data: {:?}", e);
                        break;
                    }

                    next_fetch_time = chunk_end;
                }

                tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                current_time += time::Duration::seconds(1);
            }
        });

        tokio::spawn(async move {
            if let Err(e) =
                send_data::send_data(&apigateway_client, &connection_id, message_rx, replay_start)
                    .await
            {
                log::error!("Error in send_data: {:?}", e);
            }
        });
    }

    Ok(utils::create_response())
}
