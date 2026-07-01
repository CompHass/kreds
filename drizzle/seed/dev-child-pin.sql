-- Dev seed: ensures the dev child profile (Ana) has a valid bcrypt PIN hash.
-- PIN: 1234
-- Hash: bcrypt cost=10, generated via bcryptjs
-- Run: psql -U kreds -d kreds_dev -f drizzle/seed/dev-child-pin.sql
--
-- SAFETY: only updates existing rows where pin_hash is not a valid bcrypt hash.
-- bcrypt hashes start with '$2b$' or '$2a$'; 'dummy_hash' does not.
-- This script is idempotent — re-running when pin_hash is already valid is a no-op.

UPDATE child_profiles
SET
  pin_hash = '$2b$10$HHELzkKY7O/IfRlkEDHgmO3m/9iNAuqhWVkfVpsn3708b/Lrr902W',
  updated_at = NOW()
WHERE
  pin_hash NOT LIKE '$2%';
