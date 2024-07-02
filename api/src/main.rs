use databento::{
    dbn::{InstrumentDefMsg, SType, Schema},
    historical::timeseries::GetRangeParams,
    HistoricalClient,
};
use lambda_http::{run, service_fn, tracing, Body, Error, Request, RequestExt, Response};
use time::{Duration, OffsetDateTime};

async fn function_handler(event: Request) -> Result<Response<Body>, Error> {
    let start_time = event
        .query_string_parameters_ref()
        .and_then(|params| params.first("start"))
        .unwrap_or("default_start");
    let instrument = event
        .query_string_parameters_ref()
        .and_then(|params| params.first("instrument"))
        .unwrap_or("default_instrument");
    let instrument_with_suffix = format!("{}.C.0", instrument);
    println!("API Fn - start_time: {:?}, instrument_with_suffix: {:?}", start_time, instrument_with_suffix);


    let replay_start = OffsetDateTime::parse(
        "2024-06-10T14:00:00Z",
        &time::format_description::well_known::Rfc3339,
    )?;

    let replay_end = replay_start + Duration::days(1);

    let mut client = HistoricalClient::builder().key_from_env()?.build()?;

    let mut definitions = client
        .timeseries()
        .get_range(
            &GetRangeParams::builder()
                .dataset("GLBX.MDP3")
                .date_time_range((replay_start, replay_end))
                .symbols(instrument_with_suffix)
                .stype_in(SType::Continuous)
                .schema(Schema::Definition)
                .build(),
        )
        .await
        .map_err(|e| {
            println!("WTF? {:?}", e);
            e
        })?;

    let mut message = serde_json::Value::Null;

    while let Some(definition) = definitions.decode_record::<InstrumentDefMsg>().await? {
        message = serde_json::json!({
            "instrument_id": definition.hd.instrument_id,
            "trading_reference_price": definition.trading_reference_price,
            "min_price_increment": definition.min_price_increment
        });

    }

    let resp = Response::builder()
        .status(200)
        .header("content-type", "text/html")
        .body(Body::from(serde_json::to_string(&message)?))
        .map_err(Box::new)?;

    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();

    run(service_fn(function_handler)).await
}
