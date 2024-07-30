use std::collections::HashMap;
use std::sync::Arc;
use std::time::Instant;
use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use lambda_runtime::Error;
use time::Duration;
mod get_data;
mod send_data;
use crate::utils;
use tokio::sync::oneshot;
use tokio::sync::Mutex;
use tokio::{sync::mpsc, time::Duration as TokioDuration};
use websocket::WebSocketMessage;

lazy_static::lazy_static! {
    static ref GLOBAL_STATE: Arc<Mutex<GlobalState>> = Arc::new(Mutex::new(GlobalState {
        replay_times: Vec::new(),
    }));
}

struct GlobalState {
    replay_times: Vec<String>,
}

fn parse_request_body(body: &Option<String>) -> Result<WebSocketMessage, Error> {
    match body {
        Some(body) => serde_json::from_str(body)
            .map_err(|e| Error::from(format!("Failed to deserialize request data: {}", e))),
        None => Err(Error::from("Missing body in the request")),
    }
}

pub async fn handle_default(
    event: ApiGatewayWebsocketProxyRequest,
    cancel_sender: Arc<Mutex<Option<oneshot::Sender<()>>>>,
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

    match message {
        WebSocketMessage::Subscribe { data } => {
            println!("Subscribe Hit");

            let sender_exists = cancel_sender.lock().await.is_some();
            println!("Sender exists before take: {}", sender_exists);
            
            // Cancel the previous send task if it exists
            if let Some(sender) = cancel_sender.lock().await.take() {
                println!("previous sender SEND");
                let _ = sender.send(());
                tokio::time::sleep(TokioDuration::from_millis(50)).await;
            }

            // Create a new cancel channel
            let (tx, rx) = oneshot::channel();
            *cancel_sender.lock().await = Some(tx);
            println!("New sender created and stored");

            // Verify that the sender was actually stored
            let sender_exists_after = cancel_sender.lock().await.is_some();
            println!("Sender exists after storing: {}", sender_exists_after);

            let (replay_time, instrument, exchange) =
                (data.replay_time.clone(), data.instrument, data.exchange);
            let instrument_with_suffix = format!("{}.v.0", instrument);
            let replay_start = utils::parse_replay_time(&replay_time)?;

            let apigateway_client = utils::create_apigateway_client(domain_name, stage).await?;
            let (message_tx, message_rx) = mpsc::channel(20000);

            // Update the global state with the replay time
            {
                let mut global_state = GLOBAL_STATE.lock().await;
                global_state.replay_times.push(replay_time.clone());
            }
            println!("global state: {:?}", GLOBAL_STATE.lock().await.replay_times);

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

            println!("connection_id handle_default: {}", connection_id);
            let connection_id = connection_id.to_string(); // Clone once for the new task
            let send_task = tokio::spawn(async move {
                if let Err(e) = send_data::send_data(
                    &apigateway_client,
                    &connection_id,
                    message_rx,
                    replay_start,
                    true,
                    rx
                )
                .await
                {
                    log::error!("Error in send_data: {:?}", e);
                }
            });
            tokio::try_join!(data_task, send_task)?;
        }
    }

    Ok(utils::create_response())
}