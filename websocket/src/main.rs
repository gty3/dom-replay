use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use aws_sdk_apigatewaymanagement::{
    config::{self, Region},
    Client,
};
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
    event: ApiGatewayWebsocketProxyRequest,
) -> Result<ApiGatewayProxyResponse, Error> {
    let domain_name = event.request_context.domain_name.as_deref().unwrap_or_default();
    let connection_id = event.request_context.connection_id.as_deref().unwrap_or_default();
    let stage = event.request_context.stage.as_deref().unwrap_or_default();

    let (replay_time, instrument, exchange) = parse_request_body(&event.body)?;
    let instrument_with_suffix = format!("{}.C.0", instrument);
    println!("{:?}", instrument_with_suffix);

    let replay_start = parse_replay_time(&replay_time)?;
    let replay_end = replay_start + Duration::seconds(30);

    let apigateway_client = create_apigateway_client(domain_name, stage).await?;

    let messages = get_data::get_data(replay_start, replay_end, &instrument_with_suffix, &exchange).await?;

    send_data::send_data(&apigateway_client, connection_id, messages, replay_start).await?;

    Ok(create_response())
}

fn parse_request_body(body: &Option<String>) -> Result<(String, String, String), Error> {
    match body {
        Some(body) => {
            let request_data: RequestData = serde_json::from_str(body)
                .map_err(|e| Error::from(format!("Failed to deserialize request data: {}", e)))?;
            Ok((
                request_data.data.replay_time,
                request_data.data.instrument,
                request_data.data.exchange,
            ))
        }
        None => Err(Error::from("Missing body in the request")),
    }
}

fn parse_replay_time(replay_time: &str) -> Result<OffsetDateTime, Error> {
    OffsetDateTime::parse(replay_time, &time::format_description::well_known::Rfc3339)
        .map_err(Error::from)
}

async fn create_apigateway_client(domain_name: &str, stage: &str) -> Result<Client, Error> {
    let endpoint_url = format!("https://{}/{}", domain_name, stage);
    let shared_config = aws_config::from_env()
        .region(Region::new("us-east-1"))
        .load()
        .await;
    let api_management_config = config::Builder::from(&shared_config)
        .endpoint_url(endpoint_url)
        .build();
    Ok(Client::from_conf(api_management_config))
}

#[derive(serde::Deserialize)]
struct BodyData {
    replay_time: String,
    instrument: String,
    exchange: String,
}

#[derive(serde::Deserialize)]
struct RequestData {
    data: BodyData,
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

    println!("{:?}", route_key);

    match route_key {
        "$connect" => Ok(create_response()),
        "$disconnect" => Ok(create_response()),
        _ => Ok(handle_default(
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
