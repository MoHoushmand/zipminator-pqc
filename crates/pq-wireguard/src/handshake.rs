#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HandshakeState {
    Uninitialized,
    InitiationSent,
    InitiationReceived,
    Established,
    Failed,
}

#[derive(Debug, Clone)]
pub struct HandshakeMessage {
    pub message_type: u8,
    pub ml_kem_ciphertext_placeholder: Vec<u8>,
}

pub struct Handshake {
    state: HandshakeState,
    is_initiator: bool,
}

impl Handshake {
    pub fn new_initiator() -> Self {
        Self {
            state: HandshakeState::Uninitialized,
            is_initiator: true,
        }
    }

    pub fn new_responder() -> Self {
        Self {
            state: HandshakeState::Uninitialized,
            is_initiator: false,
        }
    }

    pub fn state(&self) -> HandshakeState {
        self.state
    }
    pub fn is_initiator(&self) -> bool {
        self.is_initiator
    }

    pub fn create_initiation(&mut self) -> Result<HandshakeMessage, &'static str> {
        if !self.is_initiator {
            return Err("responder cannot initiate");
        }
        if self.state != HandshakeState::Uninitialized {
            return Err("handshake already progressed");
        }
        self.state = HandshakeState::InitiationSent;
        Ok(HandshakeMessage {
            message_type: 1,
            ml_kem_ciphertext_placeholder: vec![0xAA; 32],
        })
    }

    pub fn consume_initiation(&mut self, msg: &HandshakeMessage) -> Result<(), &'static str> {
        if self.is_initiator {
            return Err("initiator cannot consume initiation");
        }
        if msg.message_type != 1 {
            return Err("wrong message type");
        }
        if msg.ml_kem_ciphertext_placeholder.is_empty() {
            return Err("missing ML-KEM ciphertext");
        }
        self.state = HandshakeState::InitiationReceived;
        Ok(())
    }
}
