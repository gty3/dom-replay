use aws_config::meta::region::RegionProviderChain;
use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use aws_sdk_apigatewaymanagement::{config::{self, Region}, primitives::Blob, Client};
use databento::HistoricalClient;

use http::HeaderMap;
use lambda_http::Body;
use lambda_runtime::{service_fn, Error, LambdaEvent};
// use std::vec::Vec;
mod get_data;
use get_data::get_data;
mod send_data;
// use send_data::send_data;

async fn function_handler(
    event: LambdaEvent<ApiGatewayWebsocketProxyRequest>,
) -> Result<ApiGatewayProxyResponse, Error> {
    let (event, _context) = event.into_parts();

    let domain_name = event
        .request_context
        .domain_name
        .as_deref()
        .unwrap_or_default();
    let connection_id = event
        .request_context
        .connection_id
        .as_deref()
        .unwrap_or_default();
    let stage = event.request_context.stage.as_deref().unwrap_or_default();

    println!("{:?}", connection_id);
    println!("{:?}", &domain_name);
    println!("{:?}", &stage);

    let instrument = "CLM4";
    let dataset = "GLBX.MDP3";
    let replay_start = time::OffsetDateTime::parse(
        "2024-05-01T14:00:00Z",
        &time::format_description::well_known::Rfc3339,
    )?;
    let replay_end = replay_start + time::Duration::seconds(1);

    let endpoint_url = format!("https://{}/{}", domain_name, stage);
    println!("{:?}", endpoint_url);
    let shared_config = aws_config::from_env()
        .region(Region::new("us-east-1"))
        .load()
        .await;
    let api_management_config = config::Builder::from(&shared_config)
        .endpoint_url(endpoint_url)
        .build();
    let apigateway_client = Client::from_conf(api_management_config);

    let mut databento_client = HistoricalClient::builder().key_from_env()?.build()?;

    let messages = get_data(
        &mut databento_client,
        replay_start,
        replay_end,
        instrument,
        dataset,
    )
    .await?;

    let result = apigateway_client
        .post_to_connection()
        .connection_id(connection_id)
        .data(Blob::new(r#"{"test": "test data"}"#))
        .send()
        .await;

    match result {
        Ok(_) => println!("Message sent successfully"),
        Err(e) => {
            println!("Error sending message: {}", e);
            log::error!("Error details: {:?}", e);
        }
    }

    // send_data(&apigateway_client, connection_id, messages, replay_start).await?;

    Ok(ApiGatewayProxyResponse {
        status_code: 200,
        headers: HeaderMap::new(),
        body: Some(Body::Text("Connected successfully".to_string())),
        is_base64_encoded: false,
        multi_value_headers: HeaderMap::new(),
    })
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    lambda_runtime::run(service_fn(function_handler)).await?;
    Ok(())
}
