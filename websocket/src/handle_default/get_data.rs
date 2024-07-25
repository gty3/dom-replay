use databento::dbn::Mbp10Msg;
use lambda_runtime::Error;
// use log::{info, error};
use crate::utils;
// use std::cmp::Reverse;
// use std::collections::BinaryHeap;
// use std::time::Instant;
use tokio::sync::mpsc::Sender;

pub async fn get_data(
    replay_start: time::OffsetDateTime,
    replay_end: time::OffsetDateTime,
    instrument: &str,
    dataset: &str,
    message_tx: Sender<(u64, String)>,
    initial: bool,
) -> Result<(), Error> {
    // let start_time = Instant::now();
    let mut mbp_decoder =
        utils::get_mbp_decoder(replay_start, replay_end, instrument, dataset).await?;

    let mut first_mbp = true;
    loop {
        match mbp_decoder.decode_record::<Mbp10Msg>().await {
            Ok(Some(mbp)) => {
                let mut mbp_json = serde_json::to_value(mbp)?;
                
                if initial && first_mbp {
                    mbp_json["initial"] = serde_json::Value::Bool(true);
                    first_mbp = false;
                }
                
                message_tx
                    .send((mbp.hd.ts_event, serde_json::to_string(&mbp_json)?))
                    .await?;
            }
            Ok(None) => break, // No more messages
            Err(e) => {
                eprintln!("Error decoding record: {:?}", e);
                break;
            }
        }
    }

    // let duration = start_time.elapsed(); // Calculate the duration
    // println!("get_data duration: {:?}", duration); // Print the duration
    Ok(())
}
