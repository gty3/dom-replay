use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use aws_sdk_apigatewaymanagement::{
    config::{self, Region},
    Client,
};
use lambda_runtime::Error;
use std::collections::HashMap;
use std::sync::Arc;
use time::{Duration, OffsetDateTime};
use tokio::sync::mpsc;
use tokio::sync::Mutex;
mod get_data;
mod send_data;
use crate::utils;

#[derive(serde::Deserialize)]
#[serde(untagged)]
enum WebSocketMessage {
    Subscribe { data: BodyData },
    Heartbeat {}
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
    let duration = 5;

    let domain_name = event
        .request_context
        .domain_name
        .as_deref()
        .unwrap_or_default();
    let connection_id = event
        .request_context
        .connection_id
        .as_deref()
        .unwrap_or_default()
        .to_string();
    let stage = event.request_context.stage.as_deref().unwrap_or_default();

    println!(
        "Parsed event details: domain_name={}, connection_id={}, stage={}",
        domain_name, connection_id, stage
    );

    let message: WebSocketMessage = parse_request_body(&event.body)?;

    match message {
        WebSocketMessage::Subscribe { data } => {
            let (replay_time, instrument, exchange) =
                (data.replay_time, data.instrument, data.exchange);
            let instrument_with_suffix = format!("{}.C.0", instrument);
            let replay_start = utils::parse_replay_time(&replay_time)?;
            let replay_end = replay_start + Duration::seconds(duration);

            let apigateway_client = utils::create_apigateway_client(domain_name, stage).await?;

            let messages =
                get_data::get_data(replay_start, replay_end, &instrument_with_suffix, &exchange)
                    .await?;

            tokio::spawn(async move {
                if let Err(e) = send_data::send_data(
                    &apigateway_client,
                    connection_id,
                    messages,
                    replay_start,
                )
                .await
                {
                    log::error!("Error in send_data: {:?}", e);
                }
            });

            Ok(utils::create_response())
        }
        WebSocketMessage::Heartbeat {} => {
            println!(
                "Received heartbeat message from connection: {}",
                connection_id
            );

            Ok(utils::create_response())
        }
    }
}

