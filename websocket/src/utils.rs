use aws_lambda_events::event::apigw::ApiGatewayProxyResponse;
use aws_sdk_apigatewaymanagement::{
    config::{self, Region},
    Client,
};
use http::HeaderMap;
use lambda_runtime::Error;
use time::{Duration, OffsetDateTime};

pub fn create_response() -> ApiGatewayProxyResponse {
    ApiGatewayProxyResponse {
        status_code: 200,
        headers: HeaderMap::new(),
        body: None,
        is_base64_encoded: false,
        multi_value_headers: HeaderMap::new(),
    }
}

pub async fn create_apigateway_client(domain_name: &str, stage: &str) -> Result<Client, Error> {
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

pub fn parse_replay_time(replay_time: &str) -> Result<OffsetDateTime, Error> {
    OffsetDateTime::parse(replay_time, &time::format_description::well_known::Rfc3339)
        .map_err(Error::from)
}

