use databento::{
    dbn::{MboMsg, Mbp10Msg, Schema, SType},
    historical::timeseries::GetRangeParams,
    HistoricalClient,
};
use lambda_runtime::Error;

pub async fn get_data(
    replay_start: time::OffsetDateTime,
    replay_end: time::OffsetDateTime,
    instrument: &str,
    dataset: &str,
) -> Result<Vec<(u64, String)>, Error> {
    println!("replay_start: {:?}", replay_start);
    let mut client = HistoricalClient::builder().key_from_env()?.build()?;

    let mut mbo_decoder = client
        .timeseries()
        .get_range(
            &GetRangeParams::builder()
                .dataset(dataset)
                .date_time_range((replay_start, replay_end))
                .symbols(instrument)
                .schema(Schema::Mbo)
                .stype_in(SType::Continuous)
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
                .stype_in(SType::Continuous)
                .build(),
        )
        .await
        .map_err(|e| {
            println!("Failed to get MBP data: {:?}", e);
            e
        })?;

    let mut messages = Vec::new();

    while let Some(mbo) = mbo_decoder.decode_record::<MboMsg>().await? {
        messages.push((mbo.hd.ts_event, serde_json::to_string(&mbo)?));
    }

    let mut is_first_mbp = true;
    while let Some(mbp) = mbp_decoder.decode_record::<Mbp10Msg>().await? {
        if is_first_mbp {
            // Add the isFirstMessage property to the first MBP message
            let mbp_json = serde_json::to_value(mbp)?;
            let mut mbp_map = mbp_json.as_object().unwrap().clone();
            mbp_map.insert("isFirstMessage".to_string(), serde_json::Value::Bool(true));
            messages.push((mbp.hd.ts_event, serde_json::to_string(&mbp_map)?));
            is_first_mbp = false;
        } else {
            messages.push((mbp.hd.ts_event, serde_json::to_string(&mbp)?));
        }
    }

    messages.sort_by_key(|k| k.0);

    Ok(messages)
}