-- Migration: Add personality_analysis column to sculptures table
-- Run this if you have an existing database

ALTER TABLE sculptures 
ADD COLUMN IF NOT EXISTS personality_analysis TEXT;
