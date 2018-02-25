import * as connectionStringParser from "pg-connection-string";
import * as knex from "knex";
import { ConnectionConfig, PartialConnectionConfig } from "./types";

/**
 * Gets a partial connection connection configuration and returns connection configuration by
 * filling individual parameters from connection string or vice versa.
 *
 * @private
 * @param   {PartialConnectionConfig} [config]  - Partial connection configuration.
 * @param   {string}                  [connectionString]  - Connection string as `postgresql://name:pass@127.0.0.1:5432/template1`
 * @param   {string}                  [database]          - Database name
 * @param   {string}                  [user]              - User name for connecting database
 * @param   {string}                  [password]          - Password for user
 * @param   {string}                  [host=127.0.0.1]    - Host address of database
 * @param   {number}                  [port=5432]         - Port of database
 * @returns {ConnectionConfig}                            - Connection configuration filled with database connection details.
 */
export function getConnectionObject({
  connectionString,
  database,
  user,
  password,
  host = "127.0.0.1",
  port = 5432
}: PartialConnectionConfig = {}): ConnectionConfig {
  let result;
  if (database) {
    result = { database, user, password, host, port };
  } else {
    const parsed = connectionStringParser.parse(connectionString || "");
    result = {
      database: parsed.database || "template1",
      user: parsed.user || user,
      password: parsed.password || password,
      host: parsed.host || host,
      port: parsed.port || port
    };
  }

  const full = `postgresql://${result.user}:${result.password}@${result.host}:${result.port}/${result.database}`;

  return { ...result, connectionString: full };
}

/**
 * Creates and returns `knex` object.
 *
 * @private
 * @param   {string} connectionString - Connection string for connecting database.
 * @returns {knex}                    - Knex object.
 */
export function createKnex(connectionString: string): knex {
  return knex({
    client: "pg",
    connection: connectionString,
    pool: { min: 0, max: 10 }
  });
}
