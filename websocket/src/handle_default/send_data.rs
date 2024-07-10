use aws_sdk_apigatewaymanagement::primitives::Blob;
use aws_sdk_apigatewaymanagement::Client;
use lambda_runtime::Error;
// use tokio::sync::mpsc;
use tokio::time::{Duration, Instant};

pub async fn send_data(
    apigateway_client: &Client,
    connection_id: &str,
    messages: Vec<(u64, String)>,
    replay_start: time::OffsetDateTime,
    // mut cancel_rx: mpsc::Receiver<()>,
) -> Result<(), Error> {
    let mut last_sleep = Instant::now();
    let mut previous_mbp_ts: Option<u64> = None;

    for (current_ts, message) in messages {
        let delay_duration = if let Some(prev_ts) = previous_mbp_ts {
            current_ts.checked_sub(prev_ts).unwrap_or_default()
        } else {
            current_ts
                .checked_sub(replay_start.unix_timestamp_nanos() as u64)
                .unwrap_or_default()
        };

        if delay_duration > 0 {
            tokio::select! {
                _ = tokio::time::sleep_until(last_sleep + Duration::from_nanos(delay_duration)) => {},
                // _ = cancel_rx.recv() => {
                //     log::info!("Cancellation received, stopping send_data");
                //     return Ok(());
                // }
            }
        }
        last_sleep = Instant::now();

        let client = apigateway_client.clone();
        let conn_id = connection_id.to_string();
        
        // Send the message without waiting for confirmation
        tokio::spawn(async move {
            if let Err(e) = client
                .post_to_connection()
                .connection_id(&conn_id)
                .data(Blob::new(message))
                .send()
                .await
            {
                log::error!("Error sending message: {:?}", e);
            }
        });

        // Check for cancellation after sending
        // if cancel_rx.try_recv().is_ok() {
        //     log::info!("Cancellation received, stopping send_data");
        //     return Ok(());
        // }

        previous_mbp_ts = Some(current_ts);
    }

    Ok(())
}