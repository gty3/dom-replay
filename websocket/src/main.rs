use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use http::HeaderMap;
use lambda_http::Body;
use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};

async fn function_handler(
    event: LambdaEvent<ApiGatewayWebsocketProxyRequest>,
) -> Result<ApiGatewayProxyResponse, Error> {
    println!("Received event: {:?}", event.payload);

    let resp = ApiGatewayProxyResponse {
        status_code: 200,
        headers: {
            let mut headers = HeaderMap::new();
            headers.insert("Content-Type", "text/html".parse().unwrap());
            headers
        },
        multi_value_headers: Default::default(),
        body: Some(Body::from("Hello AWS Lambda HTTP request".to_string())),
        is_base64_encoded: false,
    };

    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();

    run(service_fn(function_handler)).await
}
