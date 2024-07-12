use databento::dbn::{MboMsg, Mbp10Msg};
use lambda_runtime::Error;
// use log::{info, error};
use crate::utils;
// use std::cmp::Reverse;
// use std::collections::BinaryHeap;
use tokio::sync::mpsc::Sender;

pub async fn get_data(
    replay_start: time::OffsetDateTime,
    replay_end: time::OffsetDateTime,
    instrument: &str,
    dataset: &str,
    message_tx: Sender<(u64, String)>,
) -> Result<(), Error> {
    let (mut mbo_decoder, mut mbp_decoder) =
        utils::get_client_data(replay_start, replay_end, instrument, dataset).await?;

    let mut message_count = 0;
    let mut mbo_next = mbo_decoder.decode_record::<MboMsg>().await?;
    let mut mbp_next = mbp_decoder.decode_record::<Mbp10Msg>().await?;

    while mbo_next.is_some() || mbp_next.is_some() {
        match (mbo_next, mbp_next) {
            (Some(mbo), Some(mbp)) => {
                if mbo.hd.ts_event <= mbp.hd.ts_event {
                    if mbo.action == 84 && (mbo.side == 66 || mbo.side == 65) {
                        message_tx.send((mbo.hd.ts_event, serde_json::to_string(&mbo)?)).await?;
                        message_count += 1;
                    }
                    mbo_next = mbo_decoder.decode_record::<MboMsg>().await?;
                } else {
                    let mbp_json = serde_json::to_value(mbp)?;
                    let mut mbp_map = mbp_json.as_object().unwrap().clone();
                    mbp_map.insert(
                        "dataset_time".to_string(),
                        serde_json::Value::String(replay_start.to_string()),
                    );
                    message_tx.send((mbp.hd.ts_event, serde_json::to_string(&mbp_map)?)).await?;
                    message_count += 1;
                    mbp_next = mbp_decoder.decode_record::<Mbp10Msg>().await?;
                }
            }
            (Some(mbo), None) => {
                if mbo.action == 84 && (mbo.side == 66 || mbo.side == 65) {
                    message_tx.send((mbo.hd.ts_event, serde_json::to_string(&mbo)?)).await?;
                    message_count += 1;
                }
                mbo_next = mbo_decoder.decode_record::<MboMsg>().await?;
            }
            (None, Some(mbp)) => {
                let mbp_json = serde_json::to_value(mbp)?;
                let mut mbp_map = mbp_json.as_object().unwrap().clone();
                mbp_map.insert(
                    "dataset_time".to_string(),
                    serde_json::Value::String(replay_start.to_string()),
                );
                message_tx.send((mbp.hd.ts_event, serde_json::to_string(&mbp_map)?)).await?;
                message_count += 1;
                mbp_next = mbp_decoder.decode_record::<Mbp10Msg>().await?;
            }
            (None, None) => break,
        }
    }

    println!("Data added: {}  -----  {}", message_count, replay_start);
    Ok(())
}