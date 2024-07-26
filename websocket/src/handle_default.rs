use std::time::Instant;

use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use lambda_runtime::Error;
use time::Duration;
mod get_data;
mod send_data;
use crate::utils;
use std::sync::Arc;
use tokio::sync::{broadcast, Mutex};
use tokio::{sync::mpsc, time::Duration as TokioDuration};
use websocket::WebSocketMessage;

fn parse_request_body(body: &Option<String>) -> Result<WebSocketMessage, Error> {
    match body {
        Some(body) => serde_json::from_str(body)
            .map_err(|e| Error::from(format!("Failed to deserialize request data: {}", e))),
        None => Err(Error::from("Missing body in the request")),
    }
}
type CancelChannel = broadcast::Sender<()>;
static CANCEL_CHANNEL: tokio::sync::OnceCell<Arc<Mutex<CancelChannel>>> = tokio::sync::OnceCell::const_new();

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
        .unwrap_or_default();
    let stage = event.request_context.stage.as_deref().unwrap_or_default();

    let message: WebSocketMessage = parse_request_body(&event.body)?;

    let cancel_sender = CANCEL_CHANNEL
        .get_or_init(|| async { 
            let (sender, _) = broadcast::channel::<()>(1);
            Arc::new(Mutex::new(sender))
        })
        .await;

    match message {
        WebSocketMessage::Subscribe { data } => {
            let _ = cancel_sender.lock().await.send(());

            let (new_cancel_sender, mut cancel_receiver) = broadcast::channel::<()>(1);
            *cancel_sender.lock().await = new_cancel_sender;


            let (replay_time, instrument, exchange) =
                (data.replay_time, data.instrument, data.exchange);
            let instrument_with_suffix = format!("{}.v.0", instrument);
            let replay_start = utils::parse_replay_time(&replay_time)?;
            
            let apigateway_client = utils::create_apigateway_client(domain_name, stage).await?;
            let (message_tx, message_rx) = mpsc::channel(20000);

            let data_task = tokio::spawn(async move {
                let mut current_time = replay_start;
                let end_time = replay_start + Duration::seconds(30);
                let chunk_duration = Duration::seconds(5);
                let mut iteration = 0;

                while current_time < end_time {
                    let iteration_start = Instant::now();
                    let chunk_end = current_time + chunk_duration;

                    if let Err(e) = get_data::get_data(
                        current_time,
                        chunk_end,
                        &instrument_with_suffix,
                        &exchange,
                        message_tx.clone(),
                        iteration == 0,
                    )
                    .await
                    {
                        log::error!("Error in get_data: {:?}", e);
                        break;
                    }

                    let elapsed = iteration_start.elapsed();
                    let sleep_duration = if iteration < 2 {
                        TokioDuration::from_secs(0)
                    } else {
                        TokioDuration::from_secs(5).saturating_sub(elapsed)
                    };
                    tokio::time::sleep(sleep_duration).await;
                    current_time = chunk_end;
                    iteration += 1;

                    let elapsed = iteration_start.elapsed();
                    println!("Iteration {} elapsed time: {:?}", iteration, elapsed);
                }
            });
            let connection_id_clone = connection_id.to_string();
            let send_task = tokio::spawn(async move {
                if let Err(e) = send_data::send_data(
                    &apigateway_client,
                    &connection_id_clone,
                    message_rx,
                    replay_start,
                    true,
                )
                .await
                {
                    log::error!("Error in send_data: {:?}", e);
                }
            });
            tokio::spawn(async move {
                tokio::select! {
                    _ = data_task => {},
                    _ = send_task => {},
                    _ = cancel_receiver.recv() => {
                        // Subscription cancelled, exit the combined task
                        println!("Combined task cancelled");
                    }
                }
            });
            // subscriptions_guard.insert(subscription_key, combined_task);
        }
    }

    Ok(utils::create_response())
}
