use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use lambda_runtime::{service_fn, Error, LambdaEvent};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio::sync::Mutex;
mod handle_default;
mod utils;

type CancelChannels = Arc<Mutex<HashMap<String, mpsc::Sender<()>>>>;

async fn function_handler(
    event: LambdaEvent<ApiGatewayWebsocketProxyRequest>,
) -> Result<ApiGatewayProxyResponse, Error> {
    let (event, _context) = event.into_parts();
    let route_key = event
        .request_context
        .route_key
        .as_deref()
        .unwrap_or_default();

    println!("{:?}", event);

    match route_key {
        "$connect" => Ok(utils::create_response()),
        "$disconnect" => Ok(utils::create_response()),
        _ => handle_default::handle_default(event).await,
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let cancel_channels: CancelChannels = Arc::new(Mutex::new(HashMap::new()));

    lambda_runtime::run(service_fn(|event| {
        function_handler(event)
    }))
    .await?;

    Ok(())
}
