WITH entites AS (
  SELECT
    c.oid AS "oid",
    c.relnamespace AS "schemaOid",
    c.relkind AS "kind",
    CASE c.relkind
      WHEN 'r' THEN 'table'
      WHEN 'v' THEN 'view'
      WHEN 'm' THEN 'materialized view'
      WHEN 'p' THEN 'partitioned table'
      WHEN 'S' THEN 'sequence'
    END AS "kindName",
    pg_namespace.nspname AS "schema",
    c.relname AS "name",
    pg_catalog.obj_description(c.oid, 'pg_class') AS "comment",
    (
      SELECT pg_get_expr(adbin, adrelid)
      FROM pg_attrdef
      WHERE
        pg_get_expr(adbin, adrelid) LIKE 'nextval(%'
        AND adrelid = c.oid  -- table name optionally schema-qualified
      LIMIT 1
    ) AS "defaultValue"
  FROM
    pg_class c
    JOIN pg_catalog.pg_namespace on pg_namespace.oid = c.relnamespace
  WHERE
    c.relkind IN ('r', 'v', 'm', 'p', 'S') -- only tables (r), views (v), materialized views (m), partitioned table (p), sequences (S)
   AND c.relnamespace = ANY ($1)
  ORDER BY
    pg_namespace.nspname,
    LOWER(relname)
)

SELECT
  *,
  -- NOTE:
  -- Sequences does not belong to tables. This query finds first column with default value having "nextval(...)" in table and fetches
  -- sequence name from it. This is just a convention.
  substr(substr("defaultValue", 0, length("defaultValue") - 11 ), 10) AS "sequenceName",
  CASE
    WHEN entites.comment LIKE '%\@masterdata%' THEN 'masterdata'
    WHEN entites.comment LIKE '%\@meta%' THEN 'meta'
    ELSE 'dev'
  END AS "runeType"
FROM entites
