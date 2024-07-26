use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use tokio::sync::oneshot;

#[derive(serde::Deserialize)]
#[serde(untagged)]
pub enum WebSocketMessage {
    Subscribe { data: BodyData },
    // Unsubscribe { data: BodyData },
}

#[derive(serde::Deserialize)]
pub struct BodyData {
    pub replay_time: String,
    pub instrument: String,
    pub exchange: String,
}

// pub struct UnsubscriptionData {
//     pub replay_time: String,
//     pub instrument: String,
//     pub exchange: String,
// }

pub type CancellationSender = oneshot::Sender<()>;
pub type SubscriptionMap = Arc<Mutex<HashMap<String, CancellationSender>>>;