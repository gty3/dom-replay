use aws_sdk_apigatewaymanagement::primitives::Blob;
use aws_sdk_apigatewaymanagement::Client;
use lambda_runtime::Error;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::mpsc::Receiver;
use tokio::sync::Mutex;
use tokio::task::JoinHandle;
use tokio::time::{Duration, Instant};

pub async fn send_data(
    apigateway_client: &Client,
    connection_id: &str,
    mut message_rx: Receiver<(u64, String)>,
    replay_start: time::OffsetDateTime,
    mut wait_for_initial: bool,
    subscriptions: Arc<Mutex<HashMap<String, JoinHandle<()>>>>,
    subscription_key_clone: &String
) -> Result<(), Error> {
    let start_time = tokio::time::Instant::now();
    let mut message_count = 0;
    let mut last_log_time = Instant::now();

    let replay_start_nanos = replay_start.unix_timestamp_nanos() as u64;
    while let Some((current_ts, message)) = message_rx.recv().await {
        let target_time = current_ts.saturating_sub(replay_start_nanos);
        let elapsed = start_time.elapsed().as_nanos() as u64;
        message_count += 1;

        if !subscriptions.lock().await.contains_key(subscription_key_clone) {
            println!(
                "Subscription cancelled for connection_id: {}",
                subscription_key_clone
            );
            break;
        }

        if last_log_time.elapsed() >= Duration::from_secs(5) {
            println!("Messages sent in the last 5 seconds: {}", message_count);
            message_count = 0;
            last_log_time = Instant::now();
        }

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

        let subscriptions_clone = Arc::clone(&subscriptions);
        let subscription_key = subscription_key_clone.clone();
        tokio::spawn(async move {
            if !subscriptions_clone.lock().await.contains_key(&subscription_key) {
                println!(   "Subscription cancelled for connection_id: {}", subscription_key);
                return;
            }
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
