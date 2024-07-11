use databento::{
  dbn::{decode::AsyncDbnDecoder, SType, Schema},
  historical::timeseries::GetRangeParams,
  HistoricalClient,
};
use lambda_runtime::Error;
use tokio::io::AsyncReadExt;

pub async fn get_client_data(
  replay_start: time::OffsetDateTime,
  replay_end: time::OffsetDateTime,
  instrument: &str,
  dataset: &str,
) -> Result<(AsyncDbnDecoder<impl AsyncReadExt>, AsyncDbnDecoder<impl AsyncReadExt>), Error> {
  
  let mut client = HistoricalClient::builder().key_from_env()?.build()?;

  let mbo_decoder = client
      .timeseries()
      .get_range(
          &GetRangeParams::builder()
              .dataset(dataset)
              .date_time_range((replay_start, replay_end))
              .symbols(instrument)
              .schema(Schema::Mbo)
              .stype_in(SType::Continuous)
              .build(),
      )
      .await
      .map_err(|e| {
          println!("Failed to get MBO data: {:?}", e);
          e
      })?;

  let mbp_decoder = client
      .timeseries()
      .get_range(
          &GetRangeParams::builder()
              .dataset(dataset)
              .date_time_range((replay_start, replay_end))
              .symbols(instrument)
              .schema(Schema::Mbp10)
              .stype_in(SType::Continuous)
              .build(),
      )
      .await
      .map_err(|e| {
          println!("Failed to get MBP data: {:?}", e);
          e
      })?;

  Ok((mbo_decoder, mbp_decoder))
}