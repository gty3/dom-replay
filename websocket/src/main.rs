use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use lambda_runtime::{service_fn, Error, LambdaEvent};
use websocket::SubscriptionMap;
mod handle_default;
mod utils;
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

async fn function_handler(
    event: LambdaEvent<ApiGatewayWebsocketProxyRequest>,
    subscriptions: SubscriptionMap,
) -> Result<ApiGatewayProxyResponse, Error> {
    let (event, _context) = event.into_parts();
    let route_key = event
        .request_context
        .route_key
        .as_deref()
        .unwrap_or_default();
    let connection_id = event
        .request_context
        .connection_id
        .as_deref()
        .unwrap_or_default()
        .to_string();

        match route_key {
            "$connect" => {
                println!("Connecting: {}", connection_id);

               
                Ok(utils::create_response())
            },
            "$disconnect" => {
                println!("Disconnecting: {}", connection_id);
                let mut subs = subscriptions.lock().unwrap();
                if let Some(cancel_tx) = subs.remove(&connection_id) {
                    match cancel_tx.send(()) {
                        Ok(_) => println!("Disconnected: {}", connection_id),
                        Err(e) => println!("Failed to send disconnect signal: {:?}", e),
                    }
                } else {
                    println!("No subscription found for connection: {}", connection_id);
                }
                Ok(utils::create_response())
            }
            _ => {
                let cancel_rx = {
                    let mut subs = subscriptions.lock().unwrap();
                    
                    // Cancel all existing subscriptions
                    for (_, cancel_tx) in subs.drain() {
                        let _ = cancel_tx.send(());
                    }
                    
                    // Create a new cancellation channel for this connection
                    let (cancel_tx, cancel_rx) = tokio::sync::oneshot::channel();
                    subs.insert(connection_id.clone(), cancel_tx);
            
                    println!("Active connections: {:?}", subs.keys().collect::<Vec<_>>());
            
                    cancel_rx
                }; // MutexGuard is dropped here
            
                match handle_default::handle_default(event, cancel_rx).await {
                    Ok(response) => Ok(response),
                    Err(e) => {
                        eprintln!("Error in handle_default: {:?}", e);
                        Ok(utils::create_response())
                    }
                }
            }
        }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let subscriptions: SubscriptionMap = Arc::new(Mutex::new(HashMap::new()));

    lambda_runtime::run(service_fn(|event| {
        let subscriptions_clone = subscriptions.clone();
        function_handler(event, subscriptions_clone)
    }))
    .await?;

    Ok(())
}
