import { ServerWebSocket } from "bun";
import { config } from "../config";
import { AuthGatewayWebSocketData } from "../types";

export function handleAuthOpen(
  ws: ServerWebSocket<AuthGatewayWebSocketData>
): void {
  ws.send(
    JSON.stringify({
      op: "hello",
      timeout_ms: config.websocket.timeoutMs,
      heartbeat_interval: config.websocket.heartbeatIntervalMs,
    })
  );
}

export async function handleAuthMessage(
  ws: ServerWebSocket<AuthGatewayWebSocketData>,
  data: { op: string; [key: string]: unknown }
): Promise<void> {
  switch (data.op) {
    case "heartbeat":
      ws.send(JSON.stringify({ op: "heartbeat_ack" }));
      break;

    case "init":
      await handleInit(ws, data.encoded_public_key as string);
      break;

    case "nonce_proof":
      await handleNonceProof(ws, data.nonce as string);
      break;

    default:
      console.log("Unknown auth gateway op:", data.op);
  }
}

async function handleInit(
  ws: ServerWebSocket<AuthGatewayWebSocketData>,
  encodedPublicKey: string
): Promise<void> {
  const publicKeyData = Buffer.from(encodedPublicKey, "base64");
  const publicKey = await crypto.subtle.importKey(
    "spki",
    publicKeyData,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );

  ws.data.publicKey = publicKey;

  const encryptedNonce = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    Buffer.from(ws.data.nonce)
  );

  ws.send(
    JSON.stringify({
      op: "nonce_proof",
      encrypted_nonce: Buffer.from(encryptedNonce).toString("base64"),
    })
  );
}

async function handleNonceProof(
  ws: ServerWebSocket<AuthGatewayWebSocketData>,
  nonceBase64: string
): Promise<void> {
  const nonce = Buffer.from(nonceBase64, "base64");

  if (Buffer.from(ws.data.nonce).compare(nonce) !== 0) {
    throw new Error("Invalid nonce proof");
  }

  const fingerprint = Buffer.from(
    await crypto.subtle.digest(
      "SHA-256",
      await crypto.subtle.exportKey("spki", ws.data.publicKey!)
    )
  ).toString("base64url");

  ws.send(
    JSON.stringify({
      op: "pending_remote_init",
      fingerprint,
    })
  );
}
