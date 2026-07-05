-- City description provenance (AI vs valilik vs manual)
ALTER TABLE cities ADD COLUMN IF NOT EXISTS description_source TEXT;
