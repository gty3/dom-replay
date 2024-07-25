use crate::utils;
use databento::dbn::Mbp10Msg;
use lambda_runtime::Error;
use tokio::sync::mpsc::Sender;

pub async fn get_data(
    replay_start: time::OffsetDateTime,
    replay_end: time::OffsetDateTime,
    instrument: &str,
    dataset: &str,
    message_tx: Sender<(u64, String)>,
    initial: bool,
) -> Result<(), Error> {
    let mut mbp_decoder = match utils::get_mbp_decoder(replay_start, replay_end, instrument, dataset).await {
        Ok(decoder) => decoder,
        Err(e) => {
            eprintln!("Failed to create MBP decoder: {:?}", e);
            return Err(Error::from(e));
        }
    };
    println!("MBP decoder created successfully");
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
            Ok(None) => {
                println!("None, Break");
                break;
            } // No more messages
            Err(e) => {
                println!("Error decoding record: {:?}", e);
                break;
            }
        }
    }
    Ok(())
}
