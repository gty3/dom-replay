use aws_sdk_apigatewaymanagement::primitives::Blob;
use aws_sdk_apigatewaymanagement::Client;
use lambda_runtime::Error;
// use log;


pub async fn send_data(
    apigateway_client: &Client,
    connection_id: &str,
    messages: Vec<(u64, String)>,
    replay_start: time::OffsetDateTime,
) -> Result<(), Error> {

    let mut last_sleep = tokio::time::Instant::now();
    let mut previous_mbp_ts: Option<u64> = None;

    let mut tasks = Vec::new();

    for (current_ts, message) in messages {
        let delay_duration = if let Some(prev_ts) = previous_mbp_ts {
            current_ts.checked_sub(prev_ts).unwrap_or_default()
        } else {
            current_ts
                .checked_sub(replay_start.unix_timestamp_nanos() as u64)
                .unwrap_or_default()
        };

        if delay_duration > 0 {
            tokio::time::sleep_until(
                last_sleep + tokio::time::Duration::from_nanos(delay_duration),
            )
            .await;
        }
        last_sleep = tokio::time::Instant::now();

        let client = apigateway_client.clone();
        let conn_id = connection_id.to_string();
        println!("{:?}", message);
        let task = tokio::spawn(async move {
            client
                .post_to_connection()
                .connection_id(&conn_id)
                .data(Blob::new(message))
                .send()
                .await
        });
        tasks.push(task);
        previous_mbp_ts = Some(current_ts);
    }

    for task in tasks {
      match task.await {
          Ok(result) => match result {
              Ok(_) => println!("Message sent successfully"),
              Err(e) => println!("Error sending message: {}", e),
          },
          Err(e) => println!("Task panicked: {:?}", e),
      }
  }

    Ok(())
}
