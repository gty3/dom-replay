use lambda_runtime::Error;
use databento::{
  dbn::{MboMsg, Mbp10Msg, Schema},
  historical::timeseries::GetRangeParams,
  HistoricalClient,
};

pub async fn get_data(
  databento_client: &mut HistoricalClient,
  replay_start: time::OffsetDateTime,
  replay_end: time::OffsetDateTime,
  instrument: &str,
  dataset: &str,
) -> Result<Vec<(u64, String)>, Error> {
  let mut mbo_decoder = databento_client
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

  let mut mbp_decoder = databento_client
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

  Ok(messages)
}
