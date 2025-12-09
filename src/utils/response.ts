export function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function validationError(
  errors: Record<string, { _errors: Array<{ message: string }> }>
): Response {
  return json(
    {
      message: "Invalid Form Body",
      code: 50035,
      errors,
    },
    400
  );
}
