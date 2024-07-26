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
                println!("No subscription found for connection_id: {}", connection_id);
            }
            Ok(utils::create_response())
        }
        _ => handle_default::handle_default(event).await, //subscriptions.clone()
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