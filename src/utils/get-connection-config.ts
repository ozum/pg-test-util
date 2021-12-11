import { Client, ClientConfig } from "pg";
import { parse } from "pg-connection-string";

export function getConnectionConfig(connection: Client | ClientConfig | string): ClientConfig {
  if (connection instanceof Client) return {};
  if (typeof connection === "object") return connection;
  const config = parse(connection);
  return { ...config, port: config.port ? parseInt(config.port, 10) : undefined } as ClientConfig;
}
