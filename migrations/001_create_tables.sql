-- Migration: Create main tables for reflections app

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE sculptures (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  prompt TEXT NOT NULL,
  art_style VARCHAR(255) DEFAULT 'realistic',
  meshy_task_id VARCHAR(255),
  refine_task_id VARCHAR(255),
  model_url TEXT,
  thumbnail_url TEXT,
  status VARCHAR(255),
  file_size INTEGER
);

CREATE TABLE shards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  spark TEXT,
  text TEXT,
  tint INTEGER,
  glow INTEGER,
  point INTEGER
);

CREATE TABLE voronoi_patterns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  rotation_count INTEGER,
  points JSONB
);
