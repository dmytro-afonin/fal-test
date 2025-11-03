if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw Error("SUPABASE_SERVICE_ROLE_KEY is missing!");
}

export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw Error("STRIPE_WEBHOOK_SECRET is missing!");
}

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!process.env.STRIPE_SECRET_KEY) {
  throw Error("STRIPE_SECRET_KEY is missing!");
}

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
