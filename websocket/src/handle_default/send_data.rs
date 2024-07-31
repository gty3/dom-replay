use aws_sdk_apigatewaymanagement::primitives::Blob;
use aws_sdk_apigatewaymanagement::Client;
use lambda_runtime::Error;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use tokio::sync::mpsc::Receiver;
use tokio::time::{Duration, Instant};

pub async fn send_data(
    apigateway_client: &Client,
    connection_id: &str,
    mut message_rx: Receiver<(u64, String)>,
    replay_start: time::OffsetDateTime,
) -> Result<(), Error> {
    println!("send_data triggered");
    // let start_time = tokio::time::Instant::now();
    let mut start_time = None;
    let mut message_count = 0;
    let mut last_log_time = Instant::now();

    let replay_start_nanos = replay_start.unix_timestamp_nanos() as u64;
    let error_flag = Arc::new(AtomicBool::new(false));

    while let Some((current_ts, message)) = message_rx.recv().await {
        if start_time.is_none() {
            start_time = Some(tokio::time::Instant::now()); // Set on first message
        }
        let start_time = start_time.unwrap();

        if error_flag.load(Ordering::Relaxed) {
            println!("Error flag set, stopping message processing");
            break;
        }

        let target_time = current_ts.saturating_sub(replay_start_nanos);

        let elapsed = start_time.elapsed().as_nanos() as u64;
        message_count += 1;

        if last_log_time.elapsed() >= Duration::from_secs(5) {
            println!("Messages sent in the last 5 seconds: {}", message_count);
            message_count = 0;
            last_log_time = Instant::now();
        }

        if elapsed < target_time {
            let sleep_duration = Duration::from_nanos(target_time - elapsed);
            if sleep_duration < Duration::from_millis(2) {
                tokio::time::sleep(Duration::from_millis(2)).await;
            } else {
                tokio::time::sleep(sleep_duration).await;
            }
        } else {
            tokio::time::sleep(Duration::from_millis(2)).await;
        }

        let client = apigateway_client.clone();
        let connection_id = connection_id.to_string();

        // if wait_for_initial {
        //     if let Ok(message_value) = serde_json::from_str::<serde_json::Value>(&message) {
        //         if message_value.get("initial") == Some(&serde_json::Value::Bool(true)) {
        //             match client
        //                 .post_to_connection()
        //                 .connection_id(connection_id)
        //                 .data(Blob::new(message))
        //                 .send()
        //                 .await
        //             {
        //                 Ok(_) => {
        //                     println!("INITIAL SENT SUCCESSFULLY");
        //                     wait_for_initial = false;
        //                 }
        //                 Err(e) => {
        //                     println!("Error sending initial message: {:?}", e);
        //                     return Err(Error::from(e));
        //                 }
        //             }
        //             continue;
        //         }
        //     }
        // }

        let error_flag_clone = error_flag.clone();
        // let send_start = Instant::now();
        tokio::spawn(async move {
            if let Err(e) = client
                // match client
                .post_to_connection()
                .connection_id(connection_id)
                .data(Blob::new(message))
                .send()
                .await
            {
                // Ok(_) => {
                //     // let send_duration = send_start.elapsed();
                //     // println!("Message sent in {:?}", send_duration);
                // },
                // Err(e) => {
                //     println!("Error sending message: {:?}", e);
                //     error_flag_clone.store(true, Ordering::Relaxed);
                // }
                println!("Error sending message: {:?}", e);
                error_flag_clone.store(true, Ordering::Relaxed);
            }
        });
    }

    Ok(())
}
