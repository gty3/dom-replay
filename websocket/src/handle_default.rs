use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use aws_sdk_apigatewaymanagement::primitives::Blob;
use databento::dbn::Mbp10Msg;
use lambda_runtime::Error;
use time::Duration;
mod get_data;
mod send_data;
use crate::utils;
use tokio::{sync::mpsc, time::{interval, Duration as TokioDuration}};
use websocket::WebSocketMessage;

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
        let mut replay_start = utils::parse_replay_time(&replay_time)?;

        let apigateway_client = utils::create_apigateway_client(domain_name, stage).await?;

        let price_array_replay_end = replay_start + Duration::seconds(1);
        let (_mbo_decoder, mut mbp_decoder) = utils::get_client_data(
            replay_start,
            price_array_replay_end,
            &instrument_with_suffix,
            &exchange,
        )
        .await?;

        if let Some(mbp) = mbp_decoder.decode_record::<Mbp10Msg>().await? {
            let mut price_array: Vec<f64> = mbp
                .levels
                .iter()
                .flat_map(|level| vec![level.bid_px as f64, level.ask_px as f64])
                .collect();

            price_array.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));

            let modified_mbp = serde_json::json!({
                "time": mbp.hd.ts_event,
                "price_array": price_array
            });
            let message_json = serde_json::to_string(&modified_mbp)?;

            let res = apigateway_client
                .post_to_connection()
                .connection_id(&connection_id)
                .data(Blob::new(message_json))
                .send()
                .await;
            match res {
                Ok(_) => println!("Message sent successfully"),
                Err(e) => eprintln!("Failed to send message: {:?}", e),
            }
        }

        let (message_tx, message_rx) = mpsc::channel(100);

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

                replay_start = replay_end;
                tokio::time::sleep(TokioDuration::from_secs(5)).await;
                loop_count += 1;
            }
        });

        // Spawn task for sending data
        tokio::spawn(async move {
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
        });
        
        // tokio::spawn(async move {
        //     let mut first_loop = true;
        //     let mut interval = interval(TokioDuration::from_secs(3));
        //     let mut loop_count = 0;
        //     const MAX_LOOPS: usize = 12;

        //     while loop_count < MAX_LOOPS {
        //         let replay_end = replay_start + Duration::seconds(duration);

        //         match get_data::get_data(
        //             replay_start,
        //             replay_end,
        //             &instrument_with_suffix,
        //             &exchange,
        //         )
        //         .await
        //         {
        //             Ok(messages) => {
        //                 if let Err(e) = send_data::send_data(
        //                     &apigateway_client,
        //                     &connection_id,
        //                     messages,
        //                     replay_start,
        //                 )
        //                 .await
        //                 {
        //                     log::error!("Error in send_data: {:?}", e);
        //                     break;
        //                 }
        //             }
        //             Err(e) => {
        //                 log::error!("Error in get_data: {:?}", e);
        //                 break;
        //             }
        //         }

        //         replay_start = replay_end;
        //         interval.tick().await;

        //         if first_loop {
        //             first_loop = false;
        //             interval = tokio::time::interval(TokioDuration::from_secs(5));
        //         }

        //         loop_count += 1;
        //     }
        // });
    }

    Ok(utils::create_response())
}
