// auth.js
import { betterAuth } from "better-auth";
import { stripe } from "@better-auth/stripe";
import { db } from "./db.js";
import Stripe from "stripe";

export const stripeClient = new Stripe(process.env.STRIPE_API_KEY);

// Create the tables if they don't exist

db.prepare(`
CREATE TABLE IF NOT EXISTS "user" (
  id               TEXT      PRIMARY KEY,
  firstName        TEXT      NOT NULL,
  lastName         TEXT      NOT NULL,
  email            TEXT      NOT NULL UNIQUE,
  emailVerified    BOOLEAN   NOT NULL DEFAULT 0,
  image            TEXT,
  createdAt        DATETIME  NOT NULL DEFAULT (datetime('now')),
  updatedAt        DATETIME  NOT NULL DEFAULT (datetime('now')),
  stripeCustomerId TEXT,
);`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS session (
  id               TEXT      PRIMARY KEY,
  userId           TEXT      NOT NULL,
  token            TEXT      NOT NULL,
  expiresAt        DATETIME  NOT NULL,
  ipAddress        TEXT,
  userAgent        TEXT,
  createdAt        DATETIME  NOT NULL DEFAULT (datetime('now')),
  updatedAt        DATETIME  NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
);`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS account (
  id                       TEXT      PRIMARY KEY,
  userId                   TEXT      NOT NULL,
  accountId                TEXT      NOT NULL,
  providerId               TEXT      NOT NULL,
  accessToken              TEXT,
  refreshToken             TEXT,
  accessTokenExpiresAt     DATETIME,
  refreshTokenExpiresAt    DATETIME,
  scope                    TEXT,
  idToken                  TEXT,
  password                 TEXT,
  createdAt                DATETIME  NOT NULL DEFAULT (datetime('now')),
  updatedAt                DATETIME  NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
);`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS verification (
  id            TEXT      PRIMARY KEY,
  identifier    TEXT      NOT NULL,
  value         TEXT      NOT NULL,
  expiresAt     DATETIME  NOT NULL,
  createdAt     DATETIME  NOT NULL DEFAULT (datetime('now')),
  updatedAt     DATETIME  NOT NULL DEFAULT (datetime('now'))
);`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS subscription (
    id TEXT PRIMARY KEY,
    plan TEXT NOT NULL,
    referenceId TEXT NOT NULL,
    stripeCustomerId TEXT,
    stripeSubscriptionId TEXT,
    status TEXT NOT NULL,
    periodStart INTEGER,           
    periodEnd INTEGER,             
    cancelAtPeriodEnd INTEGER NOT NULL DEFAULT 0,  
    seats INTEGER NOT NULL DEFAULT 1,
    trialStart INTEGER,
    trialEnd INTEGER
  );
`).run();

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  url: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true
  },
  user: {
    fields: {
      name: "firstName",
    },
    additionalFields: {
      lastName: { type: "string", required: true },
    },
  },
  debug: true,
  database: db,
  trustedOrigins: [
    "http://localhost:5173",
  ],
  plugins: [
    {
      stripe({
        stripeClient,
        stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        createCustomerOnSignUp: true,
      })
    },
  ],

});