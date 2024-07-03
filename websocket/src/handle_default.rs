use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use lambda_runtime::Error;
use aws_sdk_apigatewaymanagement::{
    config::{self, Region},
    Client,
};
use time::{Duration, OffsetDateTime};
use tokio::sync::mpsc;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashMap;
mod get_data;
mod send_data;
use crate::utils;

#[derive(serde::Deserialize)]
#[serde(untagged)]
enum WebSocketMessage {
    Subscribe {
        data: BodyData,
    },
    Unsubscribe {},
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

type CancelChannels = Arc<Mutex<HashMap<String, mpsc::Sender<()>>>>;

pub async fn handle_default(
    event: ApiGatewayWebsocketProxyRequest,
    cancel_channels: CancelChannels,
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
        .unwrap_or_default()
        .to_string();
    let stage = event.request_context.stage.as_deref().unwrap_or_default();

    let message: WebSocketMessage = parse_request_body(&event.body)?;

    match message {
        WebSocketMessage::Subscribe { data } => {
            let (replay_time, instrument, exchange) = (
                data.replay_time,
                data.instrument,
                data.exchange,
            );
            let instrument_with_suffix = format!("{}.C.0", instrument);
            println!("{:?}", connection_id);
            let replay_start = parse_replay_time(&replay_time)?;
            let replay_end = replay_start + Duration::seconds(30);

            let apigateway_client = create_apigateway_client(domain_name, stage).await?;

            let messages =
                get_data::get_data(replay_start, replay_end, &instrument_with_suffix, &exchange)
                    .await?;

            let (cancel_tx, cancel_rx) = mpsc::channel(1);
            {
                let mut channels = cancel_channels.lock().await;
                channels.insert(connection_id.to_string(), cancel_tx);
            }

            tokio::spawn(async move {
                if let Err(e) = send_data::send_data(&apigateway_client, &connection_id, messages, replay_start, cancel_rx).await {
                    log::error!("Error in send_data: {:?}", e);
                }
            });

            Ok(utils::create_response())
        }
        WebSocketMessage::Unsubscribe {} => {
            log::info!("Received unsubscribe message from connection: {}", connection_id);
            
            let mut channels = cancel_channels.lock().await;
            if let Some(cancel_tx) = channels.remove(&connection_id) {
                if let Err(e) = cancel_tx.send(()).await {
                    log::error!("Failed to send cancellation signal: {:?}", e);
                }
            }

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