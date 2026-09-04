-- KNGL Dublaj — temel şema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext UNIQUE,
  nickname      varchar(24) NOT NULL,
  password_hash text,
  is_vip        boolean NOT NULL DEFAULT false,
  vip_until     timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             varchar(120) UNIQUE NOT NULL,
  title            varchar(200) NOT NULL,
  source           varchar(40) NOT NULL,
  description      text NOT NULL DEFAULT '',
  duration_seconds integer NOT NULL CHECK (duration_seconds > 0),
  thumbnail_url    text NOT NULL,
  video_url        text NOT NULL,
  is_vip           boolean NOT NULL DEFAULT false,
  is_published     boolean NOT NULL DEFAULT true,
  play_count       integer NOT NULL DEFAULT 0,
  characters       jsonb NOT NULL,
  lines            jsonb NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scenes_published_created_idx ON scenes (created_at DESC) WHERE is_published;
CREATE INDEX IF NOT EXISTS scenes_published_popular_idx ON scenes (play_count DESC) WHERE is_published;
CREATE INDEX IF NOT EXISTS scenes_source_idx ON scenes (source) WHERE is_published;

CREATE TABLE IF NOT EXISTS dubs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code        varchar(8) NOT NULL,
  scene_id         uuid NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  video_url        text NOT NULL,
  thumbnail_url    text,
  voices           jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration_seconds integer NOT NULL DEFAULT 0,
  is_public        boolean NOT NULL DEFAULT true,
  is_featured      boolean NOT NULL DEFAULT false,
  view_count       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dubs_public_created_idx ON dubs (created_at DESC) WHERE is_public;
CREATE INDEX IF NOT EXISTS dubs_featured_idx ON dubs (created_at DESC) WHERE is_featured AND is_public;

CREATE TABLE IF NOT EXISTS scene_suggestions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  title       varchar(200) NOT NULL,
  url         text,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
