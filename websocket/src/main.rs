use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use aws_sdk_apigatewaymanagement::{config::{self, Region}, Client};
// use databento::HistoricalClient;
use http::HeaderMap;
use lambda_runtime::{service_fn, Error, LambdaEvent};
use time::{Duration, OffsetDateTime};

mod get_data;
mod send_data;

fn create_response() -> ApiGatewayProxyResponse {
    ApiGatewayProxyResponse {
        status_code: 200,
        headers: HeaderMap::new(),
        body: None,
        is_base64_encoded: false,
        multi_value_headers: HeaderMap::new(),
    }
}

async fn handle_default(
    domain_name: &str,
    stage: &str,
    connection_id: &str,
) -> Result<ApiGatewayProxyResponse, Error> {
    let instrument = "CLM4";
    let dataset = "GLBX.MDP3";
    let replay_start = OffsetDateTime::parse("2024-05-01T14:00:00Z", &time::format_description::well_known::Rfc3339)?;
    let replay_end = replay_start + Duration::minutes(5);

    let endpoint_url = format!("https://{}/{}", domain_name, stage);
    let shared_config = aws_config::from_env().region(Region::new("us-east-1")).load().await;
    let api_management_config = config::Builder::from(&shared_config).endpoint_url(endpoint_url).build();
    let apigateway_client = Client::from_conf(api_management_config);

    let messages = get_data::get_data(
        replay_start,
        replay_end,
        instrument,
        dataset,
    ).await?;

    send_data::send_data(&apigateway_client, connection_id, messages, replay_start).await?;

    Ok(create_response())
}

async fn function_handler(event: LambdaEvent<ApiGatewayWebsocketProxyRequest>) -> Result<ApiGatewayProxyResponse, Error> {
    let (event, _context) = event.into_parts();

    let domain_name = event.request_context.domain_name.as_deref().unwrap_or_default();
    let connection_id = event.request_context.connection_id.as_deref().unwrap_or_default();
    let stage = event.request_context.stage.as_deref().unwrap_or_default();
    let route_key = event.request_context.route_key.as_deref().unwrap_or_default();

    match route_key {
        "$connect" => Ok(create_response()),
        "$disconnect" => Ok(create_response()),
        _ => Ok(handle_default(domain_name, stage, connection_id).await?),
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    lambda_runtime::run(service_fn(function_handler)).await?;
    Ok(())
}   