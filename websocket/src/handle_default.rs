use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use lambda_runtime::Error;
use aws_sdk_apigatewaymanagement::{
    config::{self, Region},
    Client,
};
use time::{Duration, OffsetDateTime};
mod get_data;
mod send_data;
use crate::utils;

#[derive(serde::Deserialize)]
#[serde(untagged)]
enum WebSocketMessage {
    Subscribe {
        event: String,
        data: BodyData,
    },
    Unsubscribe {
        event: String,
    },
}

#[derive(serde::Deserialize)]
struct BodyData {
    replay_time: String,
    instrument: String,
    exchange: String,
}

fn parse_request_body(body: &Option<String>) -> Result<WebSocketMessage, Error> {
    match body {
        Some(body) => serde_json::from_str(body)
            .map_err(|e| Error::from(format!("Failed to deserialize request data: {}", e))),
        None => Err(Error::from("Missing body in the request")),
    }
}

pub async fn handle_default(
    event: ApiGatewayWebsocketProxyRequest,
) -> Result<ApiGatewayProxyResponse, Error> {
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

    let message: WebSocketMessage = parse_request_body(&event.body)?;
    println!("{:?}", event);
    match message {
        WebSocketMessage::Subscribe { data, .. } => {
            let (replay_time, instrument, exchange) = (
                data.replay_time,
                data.instrument,
                data.exchange,
            );
            let instrument_with_suffix = format!("{}.C.0", instrument);
            println!("{:?}", instrument_with_suffix);

            let replay_start = parse_replay_time(&replay_time)?;
            let replay_end = replay_start + Duration::seconds(30);

            let apigateway_client = create_apigateway_client(domain_name, stage).await?;

            let messages =
                get_data::get_data(replay_start, replay_end, &instrument_with_suffix, &exchange)
                    .await?;

            send_data::send_data(&apigateway_client, connection_id, messages, replay_start).await?;

            Ok(utils::create_response())
        }
        WebSocketMessage::Unsubscribe { .. } => {
            println!(
                "Received unsubscribe message from connection: {}",
                connection_id
            );
            // Handle unsubscribe logic here (e.g., clean up resources, stop sending data)
            Ok(utils::create_response())
        }
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