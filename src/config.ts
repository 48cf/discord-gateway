export const config = {
  port: 3000,
  proxy: {
    targetHost: "discord.com",
    replacements: [
      { from: "discord.com/api", to: "test.iretq.dev/api" },
      {
        from: "remote-auth-gateway.discord.gg",
        to: "test.iretq.dev/gateway/auth",
      },
      { from: "gateway.discord.gg", to: "test.iretq.dev/gateway/user" },
      { from: "media.discordapp.net", to: "test.iretq.dev/media" },
      { from: "images-ext-1.discordapp.net", to: "test.iretq.dev/images" },
      { from: "images-ext-2.discordapp.net", to: "test.iretq.dev/images" },
      { from: "cdn.discordapp.com", to: "test.iretq.dev/cdn" },
    ],
  },
  websocket: {
    timeoutMs: 5 * 60 * 1000,
    heartbeatIntervalMs: 30 * 1000,
  },
} as const;
