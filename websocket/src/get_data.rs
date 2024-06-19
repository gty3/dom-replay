use databento::{
    dbn::{MboMsg, Mbp10Msg, Schema},
    historical::timeseries::GetRangeParams,
    HistoricalClient,
};
use lambda_runtime::Error;
use std::time::Instant;

pub async fn get_data(
    replay_start: time::OffsetDateTime,
    replay_end: time::OffsetDateTime,
    instrument: &str,
    dataset: &str,
) -> Result<Vec<(u64, String)>, Error> {
    let start_time = Instant::now();
    
    let mut client = HistoricalClient::builder().key_from_env()?.build()?;

    let mut mbo_decoder = client
        .timeseries()
        .get_range(
            &GetRangeParams::builder()
                .dataset(dataset)
                .date_time_range((replay_start, replay_end))
                .symbols(instrument)
                .schema(Schema::Mbo)
                .build(),
        )
        .await
        .map_err(|e| {
            println!("Failed to get MBO data: {:?}", e);
            e
        })?;

    let mut mbp_decoder = client
        .timeseries()
        .get_range(
            &GetRangeParams::builder()
                .dataset(dataset)
                .date_time_range((replay_start, replay_end))
                .symbols(instrument)
                .schema(Schema::Mbp10)
                .build(),
        )
        .await
        .map_err(|e| {
            println!("Failed to get MBP data: {:?}", e);
            e
        })?;

    let mut messages = Vec::new();

    while let Some(mbo) = mbo_decoder.decode_record::<MboMsg>().await? {
        let price_decimal = convert_to_decimal(mbo.price);
        let mut mbo_value = serde_json::to_value(mbo)?;
        mbo_value["price_decimal"] = serde_json::json!(price_decimal);
        messages.push((mbo.hd.ts_event, serde_json::to_string(&mbo_value)?));
    }

    while let Some(mbp) = mbp_decoder.decode_record::<Mbp10Msg>().await? {
        let mut mbp_value = serde_json::to_value(mbp)?;
        if let Some(levels) = mbp_value["levels"].as_array_mut() {
            for level in levels.iter_mut().take(10) {
                if let Some(ask_px) = level.get_mut("ask_px") {
                    let ask_px_decimal = convert_to_decimal(ask_px.as_i64().unwrap_or(0));
                    *ask_px = serde_json::json!(format!("{:.2}", ask_px_decimal));
                }
                if let Some(bid_px) = level.get_mut("bid_px") {
                    let bid_px_decimal = convert_to_decimal(bid_px.as_i64().unwrap_or(0));
                    *bid_px = serde_json::json!(format!("{:.2}", bid_px_decimal));
                }
            }
        }
        messages.push((mbp.hd.ts_event, serde_json::to_string(&mbp_value)?));
    }
    messages.sort_by_key(|k| k.0);

    let duration = start_time.elapsed(); // Calculate elapsed time
    println!("Execution time: {:?}", duration); // Print execution time

    // println!("{:?}", messages);

    Ok(messages)
}

fn convert_to_decimal(tick_size: i64) -> f64 {
    tick_size as f64 * 1e-9
}
