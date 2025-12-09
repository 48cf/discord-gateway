import { ServerWebSocket } from "bun";
import { createDeflate, constants, Deflate } from "zlib";
import { GatewayWebSocketData } from "../types";
import { encode } from "./encoding";

const deflateContexts = new WeakMap<
  ServerWebSocket<GatewayWebSocketData>,
  Deflate
>();

function getDeflateContext(ws: ServerWebSocket<GatewayWebSocketData>): Deflate {
  let deflate = deflateContexts.get(ws);

  if (!deflate) {
    deflate = createDeflate();
    deflateContexts.set(ws, deflate);
  }

  return deflate;
}

function compress(deflate: Deflate, data: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    function cleanup() {
      deflate.removeListener("data", onData);
      deflate.removeListener("error", onError);
    }

    function onData(chunk: Buffer) {
      chunks.push(chunk);
    }

    function onError(err: Error) {
      cleanup();
      reject(err);
    }

    deflate.on("data", onData);
    deflate.on("error", onError);

    deflate.write(data, () => {
      deflate.flush(constants.Z_SYNC_FLUSH, () => {
        cleanup();
        resolve(Buffer.concat(chunks));
      });
    });
  });
}

export async function sendGatewayMessage(
  ws: ServerWebSocket<GatewayWebSocketData>,
  payload: object
): Promise<void> {
  const encoded = encode(payload, ws.data.encoding);
  const data = typeof encoded === "string" ? Buffer.from(encoded) : encoded;

  if (!ws.data.compress) {
    ws.send(data);
    return;
  }

  const deflate = getDeflateContext(ws);
  const compressed = await compress(deflate, data);

  ws.send(compressed);
}
