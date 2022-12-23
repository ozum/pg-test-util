import { Client, ClientConfig } from "pg";
import { parse } from "pg-connection-string";
import { VError } from "verror";

function getConnectionString(connection: Client | ClientConfig | string): string | undefined {
  if (typeof connection === "string") return connection;
  return typeof connection === "object" && "connectionString" in connection ? connection.connectionString : undefined;
}

export function getConnectionConfig(connection: Client | ClientConfig | string): ClientConfig {
  const connectionString = getConnectionString(connection);

  if (connection instanceof Client) return {};
  if (typeof connectionString === "string") {
    const config = parse(connectionString);
    return { ...config, port: config.port ? parseInt(config.port, 10) : undefined } as ClientConfig;
  }
  if (typeof connection === "object") return connection;

  throw new VError("Cannot parse connection configuration.");
}
