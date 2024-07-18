use databento::dbn::{MboMsg, Mbp10Msg};
use lambda_runtime::Error;
// use log::{info, error};
use crate::utils;
// use std::cmp::Reverse;
// use std::collections::BinaryHeap;
use tokio::sync::mpsc::Sender;
use std::time::Instant;
use tokio::join;

pub async fn get_data(
    replay_start: time::OffsetDateTime,
    replay_end: time::OffsetDateTime,
    instrument: &str,
    dataset: &str,
    message_tx: Sender<(u64, String)>,
) -> Result<(), Error> {

    let start_time = Instant::now(); 
    let (mut mbo_decoder, mut mbp_decoder) =
        utils::get_client_data(replay_start, replay_end, instrument, dataset).await?;
    loop {
        let (mbo_next, mbp_next) = join!(
            mbo_decoder.decode_record::<MboMsg>(),
            mbp_decoder.decode_record::<Mbp10Msg>()
        );
    
        // println!("mbp_next: {:?}", mbp_next);
        match (mbo_next?, mbp_next?) {
            (Some(mbo), Some(mbp)) => {
                // println!("Both mbo and mbp are Some");
                if mbo.hd.ts_event < mbp.hd.ts_event {
                    // println!("mbo_json Some: {:?}", mbo);
                    if mbo.action == 84 && (mbo.side == 66 || mbo.side == 65) {
                        message_tx.send((mbo.hd.ts_event, serde_json::to_string(&mbo)?)).await?;
                    }
                } else {
                    let mbp_json = serde_json::to_value(mbp)?;
                    println!("mbp_json Some: {:?}", mbp_json);
                    // let mut mbp_map = mbp_json.as_object().unwrap().clone();
                    // mbp_map.insert(
                    //     "dataset_time".to_string(),
                    //     serde_json::Value::String(replay_start.to_string()),
                    // );
                    message_tx.send((mbp.hd.ts_event, serde_json::to_string(&mbp_json)?)).await?;
                }
            }
            (Some(mbo), None) => {
                
                if mbo.action == 84 && (mbo.side == 66 || mbo.side == 65) {
                    println!("mbo_json TRADE None");
                    message_tx.send((mbo.hd.ts_event, serde_json::to_string(&mbo)?)).await?;
                }
            }
            (None, Some(mbp)) => {
                let mbp_json = serde_json::to_value(mbp)?;
                println!("mbp_json None: {:?}", mbp_json);
                // let mut mbp_map = mbp_json.as_object().unwrap().clone();
                // mbp_map.insert(
                //     "dataset_time".to_string(),
                //     serde_json::Value::String(replay_start.to_string()),
                // );
                message_tx.send((mbp.hd.ts_event, serde_json::to_string(&mbp_json)?)).await?;
            }
            (None, None) => break,
        }
    }

    let duration = start_time.elapsed(); // Calculate the duration
    println!("get_data duration: {:?}", duration); // Print the duration
    Ok(())
}