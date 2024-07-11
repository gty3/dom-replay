use databento::dbn::{MboMsg, Mbp10Msg};
use lambda_runtime::Error;
// use log::{info, error};

use crate::utils;

pub async fn get_data(
    replay_start: time::OffsetDateTime,
    replay_end: time::OffsetDateTime,
    instrument: &str,
    dataset: &str,
) -> Result<Vec<(u64, String)>, Error> {
    println!("replay_start: {:?}", replay_start);

    let (mut mbo_decoder, mut mbp_decoder) =
        utils::get_client_data(replay_start, replay_end, instrument, dataset).await?;

    let mut messages = Vec::new();

    while let Some(mbo) = mbo_decoder.decode_record::<MboMsg>().await? {
        if mbo.action == 84 {
            if mbo.side == 66 || mbo.side == 65 {
                messages.push((mbo.hd.ts_event, serde_json::to_string(&mbo)?));
            } else {
                continue;
            }
        }
    }

    while let Some(mbp) = mbp_decoder.decode_record::<Mbp10Msg>().await? {
        let mbp_json = serde_json::to_value(mbp)?;
        let mut mbp_map = mbp_json.as_object().unwrap().clone();
        mbp_map.insert(
            "dataset_time".to_string(),
            serde_json::Value::String(replay_start.to_string()),
        );
        messages.push((mbp.hd.ts_event, serde_json::to_string(&mbp_map)?));
    }

    messages.sort_by_key(|k| k.0);
    Ok(messages)
}
