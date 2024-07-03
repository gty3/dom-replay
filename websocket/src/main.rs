use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use lambda_runtime::{service_fn, Error, LambdaEvent};
use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashMap;
use tokio::sync::mpsc;
mod handle_default;
mod utils;

type CancelChannels = Arc<Mutex<HashMap<String, mpsc::Sender<()>>>>;


async fn function_handler(
    event: LambdaEvent<ApiGatewayWebsocketProxyRequest>,
    cancel_channels: CancelChannels,
) -> Result<ApiGatewayProxyResponse, Error> {
    let (event, _context) = event.into_parts();
    let route_key = event
        .request_context
        .route_key
        .as_deref()
        .unwrap_or_default();

    println!("{:?}", route_key);

    match route_key {
        "$connect" => Ok(utils::create_response()),
        "$disconnect" => {
            if let Some(connection_id) = event.request_context.connection_id {
                let mut channels = cancel_channels.lock().await;
                if let Some(cancel_tx) = channels.remove(&connection_id) {
                    if let Err(e) = cancel_tx.send(()).await {
                        println!("Failed to send cancellation signal: {:?}", e);
                    }
                }
            }
            Ok(utils::create_response())
        },
        _ => handle_default::handle_default(event, cancel_channels.clone()).await,
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let cancel_channels: CancelChannels = Arc::new(Mutex::new(HashMap::new()));
    
    lambda_runtime::run(service_fn(|event| {
        function_handler(event, cancel_channels.clone())
    }))
    .await?;
    
    Ok(())
}