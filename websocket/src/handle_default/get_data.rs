use databento::dbn::{MboMsg, Mbp10Msg};
use lambda_runtime::Error;
// use log::{info, error};
use crate::utils;
use std::cmp::Reverse;
use std::collections::BinaryHeap;
use tokio::sync::mpsc::Sender;

pub async fn get_data(
    replay_start: time::OffsetDateTime,
    replay_end: time::OffsetDateTime,
    instrument: &str,
    dataset: &str,
    message_tx: Sender<(u64, String)>,
) -> Result<(), Error> {
    println!("get_data: {:?}", replay_start);

    let (mut mbo_decoder, mut mbp_decoder) =
        utils::get_client_data(replay_start, replay_end, instrument, dataset).await?;

    // let mut messages = Vec::new();
    let mut combined_messages = BinaryHeap::new();
    while let Some(mbo) = mbo_decoder.decode_record::<MboMsg>().await? {
        if mbo.action == 84 && (mbo.side == 66 || mbo.side == 65) {
            combined_messages.push(Reverse((mbo.hd.ts_event, serde_json::to_string(&mbo)?)));
        }
    }

    while let Some(mbp) = mbp_decoder.decode_record::<Mbp10Msg>().await? {
        let mbp_json = serde_json::to_value(mbp)?;
        let mut mbp_map = mbp_json.as_object().unwrap().clone();
        mbp_map.insert(
            "dataset_time".to_string(),
            serde_json::Value::String(replay_start.to_string()),
        );
        combined_messages.push(Reverse((mbp.hd.ts_event, serde_json::to_string(&mbp_map)?)));
    }

    let mut message_count = 0;

    while let Some(Reverse((ts, msg))) = combined_messages.pop() {
        message_tx.send((ts, msg)).await?;
        message_count += 1;
    }
        println!("Number of messages added: {}", message_count);
    Ok(())
}
