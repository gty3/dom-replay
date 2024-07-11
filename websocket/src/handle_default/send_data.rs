use aws_sdk_apigatewaymanagement::primitives::Blob;
use aws_sdk_apigatewaymanagement::Client;
use lambda_runtime::Error;
use tokio::time::{Duration, Instant};

pub async fn send_data(
    apigateway_client: &Client,
    connection_id: &str,
    messages: Vec<(u64, String)>,
    replay_start: time::OffsetDateTime,
) -> Result<(), Error> {

    println!(
        "send_data function called with connection_id: {}",
        connection_id
    );
    let mut last_sleep = Instant::now();
    let mut previous_mbp_ts: Option<u64> = None;

    for (index, (current_ts, message)) in messages.iter().cloned().enumerate() {
        let delay_duration = if let Some(prev_ts) = previous_mbp_ts {
            current_ts.checked_sub(prev_ts).unwrap_or_default()
        } else {
            current_ts
                .checked_sub(replay_start.unix_timestamp_nanos() as u64)
                .unwrap_or_default()
        };
        println!("Delay duration: {:?}", delay_duration);
        if delay_duration > 0 {
            tokio::select! {
                _ = tokio::time::sleep_until(last_sleep + Duration::from_nanos(delay_duration)) => {},
            }
        }
        last_sleep = Instant::now();

        let client = apigateway_client.clone();
        let connection_id = connection_id.to_string();

        if index == 0 {
            println!("first message, connection_id {:?}", connection_id);
            // Send the first message and wait for confirmation
            if let Err(e) = client
                .post_to_connection()
                .connection_id(connection_id)
                .data(Blob::new(message.clone()))
                .send()
                .await
            {
                println!("Error sending first message: {:?}", e);
                return Err(e.into());
            }
        }
        else {
            // Send the remaining messages without waiting for confirmation
            tokio::spawn(async move {
                if let Err(e) = client
                    .post_to_connection()
                    .connection_id(connection_id)
                    .data(Blob::new(message.clone()))
                    .send()
                    .await
                {
                    println!("Error sending message: {:?}", e);
                }
            });
        }

        previous_mbp_ts = Some(current_ts);
    }

    Ok(())
}
