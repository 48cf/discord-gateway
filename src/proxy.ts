import { config } from "./config";

const HEADERS_TO_FORWARD = ["Range", "Accept", "Accept-Encoding"];
const BINARY_HEADERS_TO_FORWARD = [
  "Accept-Ranges",
  "Content-Type",
  "Content-Length",
  "Content-Range",
];

function isTextContent(contentType: string): boolean {
  return (
    contentType.includes("text/") ||
    contentType.includes("application/json") ||
    contentType.includes("application/javascript")
  );
}

function rewriteUrls(text: string): string {
  let result = text;
  for (const { from, to } of config.proxy.replacements) {
    result = result.replaceAll(from, to);
  }
  return result;
}

export async function forwardToDiscord(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const headers = new Headers();

  // Forward relevant headers
  for (const header of HEADERS_TO_FORWARD) {
    const value = req.headers.get(header);

    if (value) {
      headers.set(header, value);
    }
  }

  const response = await fetch(
    `https://${config.proxy.targetHost}${url.pathname}${url.search}`,
    {
      method: req.method,
      headers,
    }
  );

  const contentType =
    response.headers.get("Content-Type") || "application/octet-stream";

  if (isTextContent(contentType)) {
    const text = await response.text();
    const data = rewriteUrls(text);

    return new Response(data, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
      },
    });
  }

  const responseHeaders = new Headers();

  for (const header of BINARY_HEADERS_TO_FORWARD) {
    const value = response.headers.get(header);

    if (value) {
      responseHeaders.set(header, value);
    }
  }

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
