use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
// use futures::channel::oneshot;
use lambda_runtime::{service_fn, Error, LambdaEvent};
use tokio::sync::oneshot;
mod handle_default;
mod utils;
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct ConnectionState {
    cancel_tx: Option<oneshot::Sender<()>>,
    cancel_flag: Arc<AtomicBool>,
}

async fn function_handler(
    event: LambdaEvent<ApiGatewayWebsocketProxyRequest>,
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
        }
        "$disconnect" => {
            Ok(utils::create_response())
        }
        _ => handle_default::handle_default(event).await,
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {

    lambda_runtime::run(service_fn(|event| {
        async move { function_handler(event).await }
    }))
    .await?;

    Ok(())
}
