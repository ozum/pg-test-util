/** Connection information. */
export type ConnectionConfig = {
  /** Connection string as `postgresql://name:pass@127.0.0.1:5432/template1` */
  connectionString: string;
  /**  Database name */
  database: string;
  /** User name for connecting database */
  user: string;
  /** Password for user */
  password: string;
  /** Host address of database */
  host: string;
  /** ort of database */
  port: number;
};

/** Connection information which includes connection string and optional configuration details. */
export interface ConnectionConfigWithString {
  connectionString: string;
  database?: string;
  user?: string;
  password?: string;
  host?: string;
  port?: number;
}

/** Connection information which includes connection details, but not connection string. */
export interface ConnectionConfigWithObject {
  connectionString?: undefined;
  database: string;
  user: string;
  password: string;
  host?: string;
  port?: number;
}

/** Type to store table details.  */
export type TableInfo = {
  /** Schema name of the table. */
  schema: string;
  /** Table name */
  table: string;
};

export type SequenceInfo = {
  /** Schema name of the table sequence is defined. */
  schema: string;
  /** Table name of the sequence. */
  table: string;
  /** Column name which sequence is related to. */
  column: string;
  /** Name of the sequence */
  sequence: string;
};
