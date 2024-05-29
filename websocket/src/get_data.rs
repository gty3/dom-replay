use databento::{
    dbn::{MboMsg, Mbp10Msg, Schema},
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
        let mut cloned_mbp = mbp.clone();
        cloned_mbp.levels[0].bid_px /= 1000000000; //this number is not a decimal!
        
        cloned_mbp.levels[0].ask_px /= 1000000000;
        messages.push((mbp.hd.ts_event, serde_json::to_string(&cloned_mbp)?));
    }

    messages.sort_by_key(|k| k.0);

    println!("{:?}", messages);

    Ok(messages)
}
