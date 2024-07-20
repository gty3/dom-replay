use crate::utils;
use aws_sdk_apigatewaymanagement::primitives::Blob;
use aws_sdk_apigatewaymanagement::Client as ApiGatewayManagementClient;
use databento::dbn::Mbp10Msg;
use lambda_runtime::Error;
use time::Duration;

pub async fn send_price_array(
    apigateway_client: &ApiGatewayManagementClient,
    connection_id: &str,
    replay_start: time::OffsetDateTime,
    instrument_with_suffix: &str,
    exchange: &str,
) -> Result<(), Error> {
    let price_array_replay_end = replay_start + Duration::seconds(1);
    let mut mbp_decoder = utils::get_mbp_decoder(
        replay_start,
        price_array_replay_end,
        instrument_with_suffix,
        exchange,
    )
    .await?;

    let cl_increment = 10000000;

    if let Some(mbp) = mbp_decoder.decode_record::<Mbp10Msg>().await? {
        let mut price_array: Vec<f64> = mbp
            .levels
            .iter()
            .flat_map(|level| vec![level.bid_px as f64, level.ask_px as f64])
            .collect();

        price_array.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));

        let mut complete_price_array = Vec::new();
        for window in price_array.windows(2) {
            let current = window[0];
            let next = window[1];
            complete_price_array.push(current);
            
            let expected_next = current - cl_increment as f64;
            if next < expected_next {
                let mut missing = expected_next;
                while missing > next {
                    complete_price_array.push(missing);
                    missing -= cl_increment as f64;
                }
            }
        }
        complete_price_array.push(*price_array.last().unwrap());

        let modified_mbp = serde_json::json!({
            "time": mbp.hd.ts_event,
            "price_array": complete_price_array,
            "bids": mbp.levels.iter().map(|level| {
                serde_json::json!({
                    "price": level.bid_px,
                    "size": level.bid_sz
                })
            }).collect::<Vec<_>>(),
            "offers": mbp.levels.iter().map(|level| {
                serde_json::json!({
                    "price": level.ask_px,
                    "size": level.ask_sz
                })
            }).collect::<Vec<_>>(),
        });
        let message_json = serde_json::to_string(&modified_mbp)?;

        let res = apigateway_client
            .post_to_connection()
            .connection_id(connection_id)
            .data(Blob::new(message_json))
            .send()
            .await;
        match res {
            Ok(_) => println!("Message sent successfully"),
            Err(e) => eprintln!("Failed to send message: {:?}", e),
        }
    }

    Ok(())
}
