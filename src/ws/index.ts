import { ServerWebSocket } from "bun";
import {
  WebSocketData,
  WebSocketType,
  AuthGatewayWebSocketData,
  GatewayWebSocketData,
} from "../types";
import { handleAuthOpen, handleAuthMessage } from "./auth-gateway";
import { handleGatewayOpen, handleGatewayMessage } from "./user-gateway";
import { decode } from "./encoding";

type UpgradeToWebSocket = (
  req: Request,
  server: Bun.Server<WebSocketData>
) => Response | void;

export function upgradeToWebSocket(type: WebSocketType): UpgradeToWebSocket {
  return (req, server) => {
    let data: WebSocketData;

    if (type === "auth") {
      const nonce = crypto.getRandomValues(new Uint8Array(128));
      data = { type: "auth", nonce };
    } else {
      // Parse query params, e.g. ?v=10&encoding=json&compress=zlib-stream
      const searchParams = new URL(req.url).searchParams;

      const encodingParam = searchParams.get("encoding") ?? "json";
      const compressParam = searchParams.get("compress");

      let encoding: "json" | "etf";
      let compress: "zlib" | "zstd" | null;

      if (encodingParam === "etf") {
        encoding = "etf";
      } else {
        encoding = "json";
      }

      if (compressParam === "zlib-stream") {
        compress = "zlib";
      } else if (compressParam === "zstd-stream") {
        compress = "zstd";
      } else {
        compress = null;
      }

      data = {
        type: "gateway",
        compress,
        encoding,
        sequence: 0,
      };
    }

    if (!server.upgrade(req, { data })) {
      return new Response("Upgrade failed", { status: 500 });
    }
  };
}

export const websocketHandlers = {
  open(ws: ServerWebSocket<WebSocketData>) {
    if (ws.data.type === "auth") {
      handleAuthOpen(ws as ServerWebSocket<AuthGatewayWebSocketData>);
    } else if (ws.data.type === "gateway") {
      handleGatewayOpen(ws as ServerWebSocket<GatewayWebSocketData>);
    }
  },

  async message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
    if (ws.data.type === "auth") {
      // Auth gateway only uses JSON
      if (typeof message !== "string") {
        return;
      }

      const data = JSON.parse(message);
      await handleAuthMessage(
        ws as ServerWebSocket<AuthGatewayWebSocketData>,
        data
      );
    } else if (ws.data.type === "gateway") {
      // Gateway supports JSON or ETF based on connection params
      const gwWs = ws as ServerWebSocket<GatewayWebSocketData>;
      const data = decode(message, gwWs.data.encoding) as {
        op: number;
        d?: unknown;
      };
      await handleGatewayMessage(gwWs, data);
    }
  },
};
