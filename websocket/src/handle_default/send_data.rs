use aws_sdk_apigatewaymanagement::primitives::Blob;
use aws_sdk_apigatewaymanagement::Client;
use lambda_runtime::Error;
// use std::sync::{Arc, Mutex};
use tokio::sync::mpsc::Receiver;
use tokio::time::{Duration, Instant};

pub async fn send_data(
    apigateway_client: &Client,
    connection_id: &str,
    mut message_rx: Receiver<(u64, String)>,
    replay_start: time::OffsetDateTime,
) -> Result<(), Error> {
    // println!(
    //     "send_data function called with connection_id: {}",
    //     connection_id
    // );

    let start_time = tokio::time::Instant::now();
    let mut message_count = 0;
    let mut last_log_time = Instant::now();

    // let mut failed_messages: Vec<(String, u64)> = Vec::new();

    let replay_start_nanos = replay_start.unix_timestamp_nanos() as u64;

    while let Some((current_ts, message)) = message_rx.recv().await {
        let target_time = current_ts.saturating_sub(replay_start_nanos);

        let elapsed = start_time.elapsed().as_nanos() as u64;
        message_count += 1;

        if last_log_time.elapsed() >= Duration::from_secs(5) {
            println!("Messages sent in the last 5 seconds: {}", message_count);
            message_count = 0;
            last_log_time = Instant::now();
        }

        if elapsed < target_time {
            // println!("elapsed < target, wait: ({})", target_time - elapsed );
            tokio::time::sleep(Duration::from_nanos(target_time - elapsed)).await;
        }

        // let failed_messages = Arc::new(Mutex::new(Vec::new()));

        let client = apigateway_client.clone();
        let connection_id = connection_id.to_string();
        // let failed_messages = Arc::clone(&failed_messages);
        // println!("message: {:?}", message);

        tokio::spawn(async move {
            if let Err(e) = client
                .post_to_connection()
                .connection_id(connection_id.clone())
                .data(Blob::new(message))
                .send()
                .await
            {
                println!("Error sending message: {:?}", e);
            }
            // {
            //     let mut failed_messages = failed_messages.lock().unwrap();
            //     let mut found = false;
            //     for (conn_id, count) in &mut *failed_messages {
            //         if conn_id == &connection_id {
            //             *count += 1;
            //             found = true;
            //             break;
            //         }
            //     }
            //     if !found {
            //         failed_messages.push((connection_id.clone(), 1));
            //     }
            //     println!("Error sending message: {:?}", *failed_messages);
            // }
        });
    }

    Ok(())
}
