import { config } from "./config";
import { forwardToDiscord } from "./proxy";
import { login, locationMetadata, conditionalStart } from "./routes";
import { upgradeToWebSocket, websocketHandlers } from "./ws";
import { WebSocketData } from "./types";
import { errorResponse } from "./utils";

const DEFAULT_AVATAR = await Bun.file("./assets/default-avatar.jpg").bytes();

const server = Bun.serve<WebSocketData>({
  port: config.port,
  websocket: websocketHandlers,
  routes: {
    // WebSocket upgrade routes
    "/gateway/auth": upgradeToWebSocket("auth"),
    "/gateway/auth/*": upgradeToWebSocket("auth"),
    "/gateway/user": upgradeToWebSocket("gateway"),
    "/gateway/user/*": upgradeToWebSocket("gateway"),

    // API routes
    "/api/v9/auth/login": login,
    "/api/v9/auth/location-metadata": locationMetadata,
    "/api/v9/auth/conditional/start": conditionalStart,

    // Catch-all for API routes
    "/api/*": () => {
      return errorResponse("Not Found");
    },

    // CDN routes - avatars
    "/cdn/avatars/*": async (req: Request) => {
      return new Response(DEFAULT_AVATAR, {
        headers: {
          "Content-Type": "image/jpg",
        },
      });
    },

    "/app": forwardToDiscord,
    "/login": forwardToDiscord,
    "/register": forwardToDiscord,
    "/channels/*": forwardToDiscord,
    "/assets/*": forwardToDiscord,

    // Catch-all for other routes
    "/*": (req: Request) => {
      return new Response("Not Found", { status: 404 });
    },
  },
});

console.log(`Server running at ${server.url}`);
