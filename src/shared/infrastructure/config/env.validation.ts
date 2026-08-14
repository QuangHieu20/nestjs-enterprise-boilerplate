import * as Joi from 'joi';

export const envVarsSchema = Joi.object({
  // ─── Application ─────────────────────────────────────────────────────────────
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  APP_NAME: Joi.string().default('AuthService'),
  APP_PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),

  // ─── Database ────────────────────────────────────────────────────────────────
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // ─── Message Queue (RabbitMQ) ────────────────────────────────────────────────
  // Queue/event NAMES live in message-queue.constants.ts (shared contract), not here.
  RABBITMQ_URL: Joi.string().required(),
  RABBITMQ_PREFETCH: Joi.number().default(1),

  // ─── Rate limiting (throttler) ───────────────────────────────────────────────
  RATE_LIMIT_TTL: Joi.number().default(60000), // window in ms
  RATE_LIMIT_MAX: Joi.number().default(100), // max requests per window

  // ─── Google OAuth ────────────────────────────────────────────────────────────
  GOOGLE_CLIENT_ID: Joi.string().required(),

  // ─── i18n ────────────────────────────────────────────────────────────────────
  // The supported-language *list* is deliberately not configured here — it is
  // whichever catalogs exist under modules/i18n/infrastructure/catalogs/.
  I18N_HEADER_NAME: Joi.string().default('x-language-custom'),
  I18N_DEFAULT_LANGUAGE: Joi.string().valid('en', 'vi').default('en'),
});
