use aws_lambda_events::event::apigw::{ApiGatewayProxyResponse, ApiGatewayWebsocketProxyRequest};
use lambda_runtime::Error;
use time::Duration;
mod get_data;
mod send_data;
use crate::utils;
use websocket::WebSocketMessage;

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
    let duration = 300;

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
    if let WebSocketMessage::Subscribe { data } = message {
        let (replay_time, instrument, exchange) = (data.replay_time, data.instrument, data.exchange);
        let instrument_with_suffix = format!("{}.C.0", instrument);
        let replay_start = utils::parse_replay_time(&replay_time)?;
        let replay_end = replay_start + Duration::seconds(duration);

        let apigateway_client = utils::create_apigateway_client(domain_name, stage).await?;

        let messages =
            get_data::get_data(replay_start, replay_end, &instrument_with_suffix, &exchange).await?;

        tokio::spawn(async move {
            if let Err(e) =
                send_data::send_data(&apigateway_client, &connection_id, messages, replay_start).await
            {
                log::error!("Error in send_data: {:?}", e);
            }
        });
    }

    // let (replay_time, instrument, exchange) = (data.replay_time, data.instrument, data.exchange);
    // let instrument_with_suffix = format!("{}.C.0", instrument);
    // let replay_start = utils::parse_replay_time(&replay_time)?;
    // let replay_end = replay_start + Duration::seconds(duration);

    // let apigateway_client = utils::create_apigateway_client(domain_name, stage).await?;

    // let messages =
    //     get_data::get_data(replay_start, replay_end, &instrument_with_suffix, &exchange).await?;

    // tokio::spawn(async move {
    //     if let Err(e) =
    //         send_data::send_data(&apigateway_client, &connection_id, messages, replay_start).await
    //     {
    //         log::error!("Error in send_data: {:?}", e);
    //     }
    // });

    Ok(utils::create_response())
}
