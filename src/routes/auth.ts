import * as uuid from "uuid";
import { json, validationError } from "../utils";

/**
 * POST /api/v9/auth/login
 */
export async function login(req: Request): Promise<Response> {
  const data = await req.json();
  const testAuth = {
    login: "foo",
    password: "bar",
    userId: "643945264868098049",
    token: uuid.v4(),
  };

  if (data.login !== testAuth.login || data.password !== testAuth.password) {
    return validationError({
      login: {
        _errors: [{ message: "Email or password is incorrect." }],
      },
      password: {
        _errors: [{ message: "Email or password is incorrect." }],
      },
    });
  }

  return json({
    user_id: testAuth.userId,
    token: testAuth.token,
    user_settings: {
      locale: "en-US",
      theme: "dark",
    },
  });
}

/**
 * GET /api/v9/auth/location-metadata
 */
export function locationMetadata(_req: Request): Response {
  return json({
    consent_required: true,
    country_code: "PL",
    promotional_email_opt_in: {
      required: true,
      pre_checked: false,
    },
  });
}

/**
 * POST /api/v9/auth/conditional/start
 */
export function conditionalStart(_req: Request): Response {
  const ticket = uuid.v4();
  const challenge = {
    mediation: "conditional",
    publicKey: {
      timeout: 60 * 1000,
      challenge: "<challenge>",
      rpId: "test.iretq.com",
      allowCredentials: [],
      userVerification: "required",
      extensions: {},
    },
  };

  return json({
    ticket,
    challenge: JSON.stringify(challenge),
  });
}
