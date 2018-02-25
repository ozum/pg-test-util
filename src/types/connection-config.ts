let STUB = 1;

/**
 * Connection parameters object. Fills individual parameters from connection string or vice versa and returns
 * fully filled object.
 * @typedef {Object} ConnectionConfig
 * @property {string}  connectionString - Connection string as `postgresql://name:pass@127.0.0.1:5432/template1`
 * @property {string}  database         - Database name
 * @property {string}  user             - User name for connecting database
 * @property {string}  password         - Password for user
 * @property {string}  host             - Host address of database
 * @property {number}  port             - Port of database
 */
STUB = 1;

/**
 * Partial version of `ConnectionConfig`
 * @typedef {Object} PartialConnectionConfig
 * @property {string}  [connectionString] - Connection string as `postgresql://name:pass@127.0.0.1:5432/template1`
 * @property {string}  [database]         - Database name
 * @property {string}  [user]             - User name for connecting database
 * @property {string}  [password]         - Password for user
 * @property {string}  [host]             - Host address of database
 * @property {number}  [port]             - Port of database
 */
STUB = 1;

export type ConnectionConfig = {
  connectionString: string;
  database: string;
  user: string;
  password: string;
  host: string;
  port: number;
};

export type PartialConnectionConfig = Partial<ConnectionConfig>;
