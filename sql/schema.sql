SELECT
  oid AS oid,
  nspname AS name
FROM
  pg_catalog.pg_namespace
WHERE
  nspname = ANY ($1)
