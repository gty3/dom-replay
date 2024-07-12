use aws_sdk_apigatewaymanagement::primitives::Blob;
use aws_sdk_apigatewaymanagement::Client;
use lambda_runtime::Error;
use tokio::time::{Duration, Instant};
use tokio::sync::mpsc::Receiver;

pub async fn send_data(
    apigateway_client: &Client,
    connection_id: &str,
    mut message_rx: Receiver<(u64, String)>,
    replay_start: time::OffsetDateTime,
) -> Result<(), Error> {
    println!(
        "send_data function called with connection_id: {}",
        connection_id
    );

    let start_time = tokio::time::Instant::now();
    let mut message_count = 0;
    let mut last_log_time = Instant::now();

    let replay_start_nanos = replay_start.unix_timestamp_nanos() as u64;
    
    while let Some((current_ts, message)) = message_rx.recv().await {
        let target_time = current_ts.saturating_sub(replay_start_nanos);

        let elapsed = start_time.elapsed().as_nanos() as u64;
        // let target_time = current_ts.saturating_sub(replay_start.unix_timestamp_nanos() as u64);
        
        // println!("elapsed: {}, target_time: {}", elapsed, target_time);
        // if elapsed > target_time {
        //     println!("Warning: Elapsed time ({}) is greater than target time ({})", elapsed, target_time);
        // }
        
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

        let client = apigateway_client.clone();
        let connection_id = connection_id.to_string();

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