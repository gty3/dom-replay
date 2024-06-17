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
        let adjusted_mbo = adjust_price(mbo);
        messages.push((adjusted_mbo.hd.ts_event, serde_json::to_string(&adjusted_mbo)?));
    }

    while let Some(mbp) = mbp_decoder.decode_record::<Mbp10Msg>().await? {
        let adjusted_mbp = adjust_price_mbp10(mbp.clone());
        messages.push((adjusted_mbp.hd.ts_event, serde_json::to_string(&adjusted_mbp)?));
    }

    messages.sort_by_key(|k| k.0);

    let duration = start_time.elapsed(); // Calculate elapsed time
    println!("Execution time: {:?}", duration); // Print execution time

    // println!("{:?}", messages);

    Ok(messages)
}

fn adjust_price<T: HasPrice + Clone>(msg: &T) -> T {
    let mut new_msg = msg.clone();
    let adjusted_price = (new_msg.get_price() as f64) / 1_000_000_000.0;
    new_msg.set_price(adjusted_price as i64);
    new_msg
}

fn adjust_price_mbp10(mut msg: Mbp10Msg) -> Mbp10Msg {
    let adjusted_price = (msg.get_price() as f64) / 1_000_000_000.0;
    msg.set_price(adjusted_price as i64);

    for level in &mut msg.levels {
        level.bid_px = (level.bid_px as f64 / 1_000_000_000.0) as i64;
        level.ask_px = (level.ask_px as f64 / 1_000_000_000.0) as i64;
    }

    msg
}

trait HasPrice {
    fn get_price(&self) -> i64;
    fn set_price(&mut self, price: i64);
}

impl HasPrice for MboMsg {
    fn get_price(&self) -> i64 {
        self.price
    }

    fn set_price(&mut self, price: i64) {
        self.price = price;
    }
}

impl HasPrice for Mbp10Msg {
    fn get_price(&self) -> i64 {
        self.price
    }

    fn set_price(&mut self, price: i64) {
        self.price = price;
    }
}