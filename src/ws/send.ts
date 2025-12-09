import { ServerWebSocket } from "bun";
import { createDeflate, constants, Deflate } from "zlib";
import { GatewayWebSocketData } from "../types";
import { encode } from "./encoding";

import * as zstd from "@bokuweb/zstd-wasm";

await zstd.init();

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

function compressZlib(deflate: Deflate, data: Buffer): Promise<Buffer> {
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

function compressZstd(data: Buffer): Buffer {
  return Buffer.from(zstd.compress(data, 3));
}

export async function sendGatewayMessage(
  ws: ServerWebSocket<GatewayWebSocketData>,
  payload: object
): Promise<void> {
  const encoded = encode(payload, ws.data.encoding);
  const data = typeof encoded === "string" ? Buffer.from(encoded) : encoded;

  if (ws.data.compress === null) {
    ws.send(data);
    return;
  }

  let compressed: Buffer;

  if (ws.data.compress === "zstd") {
    compressed = compressZstd(data);
  } else if (ws.data.compress === "zlib") {
    const deflate = getDeflateContext(ws);
    compressed = await compressZlib(deflate, data);
  } else {
    throw new Error(`Unsupported compression method: ${ws.data.compress}`);
  }

  ws.send(compressed);
}
