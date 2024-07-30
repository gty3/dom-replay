use aws_sdk_apigatewaymanagement::primitives::Blob;
use aws_sdk_apigatewaymanagement::Client;
use lambda_runtime::Error;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use tokio::sync::mpsc::Receiver;
use tokio::sync::oneshot;
use tokio::time::{Duration, Instant};

pub async fn send_data(
    apigateway_client: &Client,
    connection_id: &str,
    mut message_rx: Receiver<(u64, String)>,
    replay_start: time::OffsetDateTime,
    mut wait_for_initial: bool,
    // cancel_flag: Arc<AtomicBool>,
    mut cancel_rx: oneshot::Receiver<()>,
) -> Result<(), Error> {
    let start_time = tokio::time::Instant::now();
    let mut message_count = 0;
    let mut last_log_time = Instant::now();

    let replay_start_nanos = replay_start.unix_timestamp_nanos() as u64;
    let error_flag = Arc::new(AtomicBool::new(false));

    loop {
        tokio::select! {
            Some((current_ts, message)) = message_rx.recv() => {
                if error_flag.load(Ordering::Relaxed) {
                    println!("Error flag set, stopping message processing",);
                    break;
                }

                let target_time = current_ts.saturating_sub(replay_start_nanos);
                let elapsed = start_time.elapsed().as_nanos() as u64;
                message_count += 1;

                // if 5 seconds have passed since
                if last_log_time.elapsed() >= Duration::from_secs(5) {
                    println!("Messages sent in the last 5 seconds: {}", message_count);
                    message_count = 0;
                    last_log_time = Instant::now();
                }

                // Sleep if not behind schedule
                if elapsed < target_time {
                    let sleep_duration = Duration::from_nanos(target_time - elapsed);
                    if sleep_duration < Duration::from_millis(2) {
                        tokio::time::sleep(Duration::from_millis(2)).await;
                    } else {
                        tokio::time::sleep(sleep_duration).await;
                    }
                } else {
                    println!("BEHIND");
                    tokio::time::sleep(Duration::from_millis(2)).await;
                }

                let client = apigateway_client.clone();
                let connection_id = connection_id.to_string();
                // let cancel_flag = cancel_flag.clone();

                if wait_for_initial {
                    if let Ok(message_value) = serde_json::from_str::<serde_json::Value>(&message) {
                        if message_value.get("initial") == Some(&serde_json::Value::Bool(true)) {
                            match client
                                .post_to_connection()
                                .connection_id(connection_id)
                                .data(Blob::new(message))
                                .send()
                                .await
                            {
                                Ok(_) => {
                                    println!("INITIAL SENT SUCCESSFULLY");
                                    wait_for_initial = false;
                                }
                                Err(e) => {
                                    println!("Error sending initial message: {:?}", e);
                                    return Err(Error::from(e));
                                }
                            }
                            continue;
                        }
                    }
                }
                // Clone error_flag for use in the spawn block
                let error_flag_clone = error_flag.clone();
                tokio::spawn(async move {
                    match client
                        .post_to_connection()
                        .connection_id(connection_id)
                        .data(Blob::new(message))
                        .send()
                        .await
                    {
                        Ok(_) => {},
                        Err(e) => {
                            println!("Error sending message: {:?}", e);
                            error_flag_clone.store(true, Ordering::Relaxed);
                        }
                    }
                });
            }
            _ = &mut cancel_rx => {
                println!("Received cancellation signal for connection: {}", connection_id);
                break;
            }
            else => {
                println!("No more messages to process, exiting loop");
                break;
            }
        }
    }

    Ok(())
}