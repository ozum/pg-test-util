import * as connectionStringParser from "pg-connection-string";
import knex from "knex";
import { ConnectionConfig, ConnectionConfigWithString, ConnectionConfigWithObject } from "./types";

export function isConnectionConfigWithObject(config: any): config is ConnectionConfigWithObject {
  return config.database && config.user && config.password;
}

/**
 * Creates and returns PostgreSQL connection string from given parameters.
 *
 * @ignore
 * @param config is configuration parameters.
 */
function getConnectionString(config: ConnectionConfigWithObject): string {
  return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
}

/**
 * Gets a partial connection connection configuration and returns connection configuration by
 * filling individual parameters from connection string or vice versa.
 *
 * @ignore
 * @param config is connection parameters.
 * @returns connection configuration filled with all database connection details.
 */
export function getConnectionObject(config: ConnectionConfigWithObject | ConnectionConfigWithString): ConnectionConfig {
  const configWithDefault = { host: "127.0.0.1", port: 5432, ...config };

  if (isConnectionConfigWithObject(configWithDefault)) {
    return { ...configWithDefault, connectionString: getConnectionString(configWithDefault) };
  }

  const parsed = connectionStringParser.parse(config.connectionString || "");
  const result = {
    database: parsed.database || "template1",
    user: parsed.user || configWithDefault.user,
    password: parsed.password || configWithDefault.password,
    host: parsed.host || configWithDefault.host,
    port: parsed.port || configWithDefault.port,
  };

  if (!isConnectionConfigWithObject(result)) {
    throw new Error("Connection configuration does not have all required info.");
  }

  return { ...result, connectionString: getConnectionString(result) };
}

/**
 * Creates and returns `knex` object.
 *
 * @ignore
 * @param connectionString is connection string for connecting database.
 * @returns knex object.
 */
export function createKnex(connectionString: string): knex {
  return knex({
    client: "pg",
    connection: connectionString,
    pool: { min: 0, max: 10 },
  });
}
