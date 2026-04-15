-- Invite Codes Migration
-- Replaces automatic starter miner grant with invite-code-gated grant

-- ─── 1. Invite codes ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invite_codes (
  id                    VARCHAR   PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  TEXT      NOT NULL UNIQUE,
  label                 TEXT,
  max_uses              INTEGER   NOT NULL DEFAULT 1,
  used_count            INTEGER   NOT NULL DEFAULT 0,
  hashrate_override     REAL,
  duration_override     INTEGER,
  daily_return_override REAL,
  is_active             BOOLEAN   NOT NULL DEFAULT true,
  created_by            VARCHAR   REFERENCES users(id),
  valid_from            TIMESTAMP,
  valid_until           TIMESTAMP,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invite_codes_code     ON invite_codes(code);
CREATE INDEX        IF NOT EXISTS idx_invite_codes_active   ON invite_codes(is_active);

-- ─── 2. Invite code redemptions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invite_code_redemptions (
  id                VARCHAR   PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id           VARCHAR   NOT NULL REFERENCES invite_codes(id),
  user_id           VARCHAR   NOT NULL REFERENCES users(id),
  redeemed_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  starter_reward_id VARCHAR   REFERENCES starter_rewards(id),
  CONSTRAINT invite_code_redemptions_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_icr_code   ON invite_code_redemptions(code_id);
CREATE INDEX IF NOT EXISTS idx_icr_user   ON invite_code_redemptions(user_id);

-- ─── 3. Update starter miner defaults ────────────────────────────────────────
UPDATE app_settings SET value = '0.4'        WHERE key = 'starter_hashrate_ths';
UPDATE app_settings SET value = '365'        WHERE key = 'starter_duration_days';
UPDATE app_settings SET value = '0.0000008'  WHERE key = 'starter_daily_return_btc';
