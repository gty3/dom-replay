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
        messages.push((mbo.hd.ts_event, serde_json::to_string(&mbo)?));
    }

    while let Some(mbp) = mbp_decoder.decode_record::<Mbp10Msg>().await? {
        messages.push((mbp.hd.ts_event, serde_json::to_string(&mbp)?));
    }

    messages.sort_by_key(|k| k.0);

    let duration = start_time.elapsed(); // Calculate elapsed time
    println!("Execution time: {:?}", duration); // Print execution time

    // println!("{:?}", messages);

    Ok(messages)
}

// fn convert_to_decimal(tick_size: i64) -> f64 {
//     tick_size as f64 * 1e-9
// }
