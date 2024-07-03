use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use lambda_runtime::{service_fn, Error, LambdaEvent};

mod handle_default;
mod utils;

async fn function_handler(
    event: LambdaEvent<ApiGatewayWebsocketProxyRequest>,
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
        "$disconnect" => Ok(utils::create_response()),
        _ => Ok(handle_default::handle_default(
            event,
        )
        .await?),
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    lambda_runtime::run(service_fn(function_handler)).await?;
    Ok(())
}
