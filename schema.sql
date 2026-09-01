-- OpenClaw Honeypot D1 Database Schema

CREATE TABLE IF NOT EXISTS attacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  country TEXT DEFAULT 'Unknown',
  asn TEXT DEFAULT 'Unknown',
  city TEXT DEFAULT '',
  region TEXT DEFAULT '',
  latitude TEXT DEFAULT '',
  longitude TEXT DEFAULT '',
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  query_string TEXT DEFAULT '',
  body TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  referer TEXT DEFAULT '',
  attack_types TEXT DEFAULT '',
  severity TEXT DEFAULT 'CLEAN',
  raw_headers TEXT DEFAULT '',
  cf_ray TEXT DEFAULT '',
  threat_score INTEGER DEFAULT 0,
  bot_score INTEGER DEFAULT -1,
  timestamp TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  honeypot TEXT DEFAULT 'openclaw'
);

CREATE TABLE IF NOT EXISTS admin_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  success INTEGER DEFAULT 0,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ip_bans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL UNIQUE,
  reason TEXT DEFAULT 'Too many failed login attempts',
  banned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  banned_until TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  ip TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);

-- Phase 5: Cron logs for WAF sync audit trail
CREATE TABLE IF NOT EXISTS cron_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL,
  result TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Credential intelligence: store only redacted metadata, never plaintext passwords
CREATE TABLE IF NOT EXISTS credential_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  honeypot TEXT NOT NULL,
  identifier_hash TEXT DEFAULT '',
  identifier_kind TEXT DEFAULT 'unknown',
  password_length INTEGER DEFAULT 0,
  password_pattern TEXT DEFAULT 'unknown',
  ip TEXT DEFAULT 'unknown',
  country TEXT DEFAULT 'Unknown',
  timestamp TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Migration: add new columns if missing (safe to run on existing DB)
CREATE INDEX IF NOT EXISTS idx_attacks_ip ON attacks(ip);
CREATE INDEX IF NOT EXISTS idx_attacks_severity ON attacks(severity);
CREATE INDEX IF NOT EXISTS idx_attacks_timestamp ON attacks(timestamp);
CREATE INDEX IF NOT EXISTS idx_attacks_created_at ON attacks(created_at);
CREATE INDEX IF NOT EXISTS idx_attacks_honeypot ON attacks(honeypot);
CREATE INDEX IF NOT EXISTS idx_attacks_honeypot_timestamp ON attacks(honeypot, timestamp);
CREATE INDEX IF NOT EXISTS idx_ip_bans_ip ON ip_bans(ip);
CREATE INDEX IF NOT EXISTS idx_admin_attempts_ip ON admin_attempts(ip);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_cron_logs_timestamp ON cron_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_cron_logs_type ON cron_logs(type);
CREATE INDEX IF NOT EXISTS idx_credential_attempts_honeypot ON credential_attempts(honeypot);
CREATE INDEX IF NOT EXISTS idx_credential_attempts_timestamp ON credential_attempts(timestamp);
CREATE INDEX IF NOT EXISTS idx_credential_attempts_pattern ON credential_attempts(password_pattern);
