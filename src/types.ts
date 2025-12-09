export type AuthGatewayWebSocketData = {
  type: "auth";
  nonce: Uint8Array;
  publicKey?: CryptoKey;
};

export type GatewayWebSocketData = {
  type: "gateway";
  compress: "zlib" | "zstd" | null;
  encoding: "json" | "etf";
  sequence: number;
};

export type WebSocketData = AuthGatewayWebSocketData | GatewayWebSocketData;

export type WebSocketType = "auth" | "gateway";
