import * as etf from "etf.js";

export type Encoding = "json" | "etf";

export function encode(data: unknown, encoding: Encoding): string | Buffer {
  if (encoding === "etf") {
    return Buffer.from(etf.pack(data));
  } else if (encoding === "json") {
    return JSON.stringify(data);
  }

  throw new Error(`Unsupported encoding: ${encoding}`);
}

export function decode(data: string | Buffer, encoding: Encoding): unknown {
  if (encoding === "etf") {
    if (typeof data === "string") {
      data = Buffer.from(data);
    }

    return etf.unpack(data);
  } else if (encoding === "json") {
    if (typeof data !== "string") {
      data = data.toString("utf8");
    }

    return JSON.parse(data);
  }

  throw new Error(`Unsupported encoding: ${encoding}`);
}
