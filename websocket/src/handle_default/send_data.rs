use aws_sdk_apigatewaymanagement::primitives::Blob;
use aws_sdk_apigatewaymanagement::Client;
use lambda_runtime::Error;
use tokio::sync::mpsc::Receiver;
use tokio::sync::oneshot;
use tokio::time::timeout;
use tokio::time::Duration;

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
    let replay_start_nanos = replay_start.unix_timestamp_nanos() as u64;

    loop {
        tokio::select! {
            Some((current_ts, message)) = message_rx.recv() => {
                let target_time = current_ts.saturating_sub(replay_start_nanos);
                let elapsed = start_time.elapsed().as_nanos() as u64;

                // Calculate sleep duration
                if elapsed < target_time {
                    let sleep_duration = Duration::from_nanos(target_time - elapsed);
                    
                    // Sleep for the calculated duration
                    tokio::select! {
                        _ = tokio::time::sleep(sleep_duration) => {}
                        _ = &mut cancel_rx => {
                            println!("Received cancellation signal during sleep for connection: {}", connection_id);
                            return Ok(());
                        }
                    }
                }

                // Send the message without waiting for response
                let client = apigateway_client.clone();
                let connection_id = connection_id.to_string();

                tokio::spawn(async move {
                    match client
                        .post_to_connection()
                        .connection_id(connection_id)
                        .data(Blob::new(message))
                        .send()
                        .await
                    {
                        Ok(_) => {},
                        Err(e) => println!("Error sending message: {:?}", e),
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