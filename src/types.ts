export type AuthGatewayWebSocketData = {
  type: "auth";
  nonce: Uint8Array;
  publicKey?: CryptoKey;
};

export type GatewayWebSocketData = {
  type: "gateway";
  compress: boolean;
  encoding: "json" | "etf";
  sequence: number;
};

export type WebSocketData = AuthGatewayWebSocketData | GatewayWebSocketData;

export type WebSocketType = "auth" | "gateway";
