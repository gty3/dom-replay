use aws_sdk_apigatewaymanagement::primitives::Blob;
use aws_sdk_apigatewaymanagement::Client;
use lambda_runtime::Error;
use tokio::time::Duration;
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

    let mut previous_ts: Option<u64> = None;
    let start_time = tokio::time::Instant::now();

    while let Some((current_ts, message)) = message_rx.recv().await {
        let elapsed = start_time.elapsed().as_nanos() as u64;
        let target_time = current_ts.saturating_sub(replay_start.unix_timestamp_nanos() as u64);

        if elapsed < target_time {
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

        previous_ts = Some(current_ts);
    }

    Ok(())
}