use aws_sdk_apigatewaymanagement::primitives::Blob;
use aws_sdk_apigatewaymanagement::Client;
use lambda_runtime::Error;
use tokio::sync::mpsc::Receiver;
use tokio::time::{Duration, Instant};

pub async fn send_data(
    apigateway_client: &Client,
    connection_id: &str,
    mut message_rx: Receiver<(u64, String)>,
    replay_start: time::OffsetDateTime,
    mut wait_for_initial: bool,
    // mut cancel_rx: tokio::sync::oneshot::Receiver<()>,
) -> Result<(), Error> {
    let start_time = tokio::time::Instant::now();
    let mut last_log_time = Instant::now();

    let replay_start_nanos = replay_start.unix_timestamp_nanos() as u64;
    println!("hello, in send_data");
    while let Some((current_ts, message)) = message_rx.recv().await {
        println!("Received message in tokio select: {:?}", message);
        let target_time = current_ts.saturating_sub(replay_start_nanos);
        let elapsed = start_time.elapsed().as_nanos() as u64;

        if last_log_time.elapsed() >= Duration::from_secs(5) {
            last_log_time = Instant::now();
        }

        // artificial sleep to mitigate max update depth error
        tokio::time::sleep(Duration::from_millis(2)).await;
        if elapsed < target_time {
            tokio::time::sleep(Duration::from_nanos(target_time - elapsed)).await;
        }

        let client = apigateway_client.clone();
        let connection_id = connection_id.to_string();

        if wait_for_initial {
            if let Ok(message_value) = serde_json::from_str::<serde_json::Value>(&message) {
                if message_value.get("initial") == Some(&serde_json::Value::Bool(true)) {
                    match client
                        .post_to_connection()
                        .connection_id(connection_id.to_string())
                        .data(Blob::new(message.clone()))
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
                    // continue;
                }
            }
        }

        tokio::spawn(async move {
            if let Err(e) = client
                .post_to_connection()
                .connection_id(connection_id)
                .data(Blob::new(message))
                .send()
                .await
            {
                println!("Error sending message: {:?}", e);
            }
        });
    }

    Ok(())
}
