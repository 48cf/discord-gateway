import { ServerWebSocket } from "bun";
import { config } from "../config";
import { GatewayWebSocketData } from "../types";
import { sendGatewayMessage } from "./send";

export const GatewayOpcodes = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  HEARTBEAT_ACK: 3,
  HELLO: 10,
} as const;

export const GatewayEvents = {
  READY: "READY",
  RESUMED: "RESUMED",
  GUILD_CREATE: "GUILD_CREATE",
  MESSAGE_CREATE: "MESSAGE_CREATE",
} as const;

interface IdentifyPayload {
  token: string;
  properties: {
    os: string;
    browser: string;
    device: string;
  };
  compress?: boolean;
  large_threshold?: number;
  shard?: [number, number];
  presence?: unknown;
  intents: number;
}

function generateSessionId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function buildReadyPayload(identify: IdentifyPayload): object {
  const sessionId = generateSessionId();
  const user = {
    id: "643945264868098049",
    username: "iretq",
    discriminator: "0",
    global_name: "iretq",
    avatar: "",
    bot: false,
    system: false,
    mfa_enabled: false,
    banner: null,
    accent_color: null,
    locale: "en-US",
    verified: true,
    email: "me@iretq.dev",
    flags: 0,
    premium_type: 0,
    public_flags: 0,
  };

  return {
    v: 10,
    session_id: sessionId,
    auth_session_id_hash: "",
    static_client_session_id: "",
    user,
    users: [],
    guilds: [],
    private_channels: [],
    session_type: "normal",
    resume_gateway_url: "wss://test.iretq.dev/gateway/user",
    shard: identify.shard || [0, 1],
    application: {
      id: user.id,
      flags: 0,
    },
    merged_presences: {
      guilds: [],
      friends: [],
    },
    merged_members: [],
    read_state: {
      version: 0,
      partial: false,
      entries: [],
    },
    user_guild_settings: {
      version: 0,
      partial: false,
      entries: [],
    },
    user_settings: {},
    user_settings_proto: "",
    tutorial: null,
    relationships: [],
    game_relationships: [],
    friend_suggestion_count: 0,
    presences: [],
    analytics_token: "",
    experiments: [],
    connected_accounts: [],
    guild_experiments: [],
    required_action: null,
    consents: {
      personalization: {
        consented: false,
      },
    },
    sessions: [],
    pending_payments: [],
    country_code: "PL",
    guild_join_requests: [],
    api_code_version: 1,
    auth: {},
    notification_settings: {
      flags: 0,
    },
    geo_restricted_guilds: [],
    explicit_content_scan_version: 0,
    failed_states: [],
    linked_users: [],
    assignments: [],
    geo_ordered_rtc_regions: [],
  };
}

async function dispatch(
  ws: ServerWebSocket<GatewayWebSocketData>,
  event: string,
  data: unknown
): Promise<void> {
  ws.data.sequence++;
  await sendGatewayMessage(ws, {
    op: GatewayOpcodes.DISPATCH,
    t: event,
    s: ws.data.sequence,
    d: data,
  });
}

export async function handleGatewayOpen(
  ws: ServerWebSocket<GatewayWebSocketData>
): Promise<void> {
  await sendGatewayMessage(ws, {
    op: GatewayOpcodes.HELLO,
    d: {
      heartbeat_interval: config.websocket.heartbeatIntervalMs,
    },
  });
}

export async function handleGatewayMessage(
  ws: ServerWebSocket<GatewayWebSocketData>,
  data: { op: number; d?: unknown }
): Promise<void> {
  switch (data.op) {
    case GatewayOpcodes.HEARTBEAT:
      await sendGatewayMessage(ws, { op: GatewayOpcodes.HEARTBEAT_ACK });
      break;

    case GatewayOpcodes.IDENTIFY:
      await handleIdentify(ws, data.d as IdentifyPayload);
      break;

    default:
      console.log("Received gateway message:", data);
      break;
  }
}

async function handleIdentify(
  ws: ServerWebSocket<GatewayWebSocketData>,
  identify: IdentifyPayload
): Promise<void> {
  const readyPayload = buildReadyPayload(identify);
  await dispatch(ws, GatewayEvents.READY, readyPayload);
}
