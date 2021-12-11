/* eslint-disable no-return-assign */
import { promises } from "fs";
import { join } from "path";
import { Client, ClientConfig } from "pg";
import escape = require("pg-escape");
import VError from "verror";
import { SequenceInfo, EntityInfo } from "./types";

const { readFile } = promises;

export type Oid = string;

/** @ignore */
export type DatabaseConstructorArgs = {
  clientConfig: ClientConfig;
  schemas?: string[];
  cleanup: () => Promise<void>;
  drop: () => Promise<void>;
};

/** Execute tasks related to individual database such as connecting, querying, getting tables, getting sequences etc. */
export default class Database {
  readonly #cleanup: () => Promise<void>;
  readonly #clientConfig: ClientConfig;
  readonly #schemaOids: Record<string, Oid> = {};
  #isConnected = false;
  #tables: EntityInfo[] = [];
  #views: EntityInfo[] = [];
  #materializedViews: EntityInfo[] = [];
  #partitionedTables: EntityInfo[] = [];
  #sequences: SequenceInfo[] = [];
  #includedSchemas: string[];

  /** [node-postgres client](https://node-postgres.com/api/client) */
  readonly client: Client;

  /** Drops the database. */
  readonly drop: () => Promise<void>;

  /** @ignore */
  private constructor(client: Client, { clientConfig, schemas = ["public"], cleanup, drop }: DatabaseConstructorArgs) {
    this.client = client;
    this.#clientConfig = clientConfig;
    this.#cleanup = cleanup;
    this.drop = drop;
    this.#includedSchemas = schemas;
  }

  /** @ignore */
  static async new(args: DatabaseConstructorArgs): Promise<Database> {
    const database = new Database(new Client(args.clientConfig), args);
    await database.connect();
    return database;
  }

  async #getError(error: Error | VError, message: string): Promise<VError> {
    await this.#cleanup();
    return new VError(error, `${message} for '${this.name} database'`);
  }

  /** Name of the database */
  get name(): string {
    return this.#clientConfig.database as string;
  }

  /** Connects to database. */
  async connect(): Promise<void> {
    if (this.#isConnected) return;
    try {
      this.#isConnected = true;
      await this.client.connect();
    } catch (error: any) {
      throw await this.#getError(error, "Cannot connect client");
    }
  }

  /** Disconnects from database. */
  async disconnect(): Promise<void> {
    if (!this.#isConnected) return;
    try {
      this.#isConnected = false;
      await this.client.end();
    } catch (error: any) {
      throw await this.#getError(error, "Cannot disconnect client");
    }
  }

  /** Fetches database objects (i.e. tables, sequences) from database and refreshes the cache of the object. If you create new tables etc., you should refresh. */
  async refresh(): Promise<void> {
    if (Object.keys(this.#schemaOids).length === 0) {
      const schemas = await this.queryFile<{ oid: Oid; name: string }>(join(__dirname, "../sql/schema.sql"), [this.#includedSchemas]);
      schemas.forEach((schema) => (this.#schemaOids[schema.name] = schema.oid));
    }

    const entityOidMapper: Record<number, any> = {};
    const entities = await this.queryFile(join(__dirname, "../sql/entity.sql"), [Object.values(this.#schemaOids)]);
    const columns = await this.queryFile(join(__dirname, "../sql/column.sql"), [Object.values(this.#schemaOids)]);

    this.#tables = [];
    this.#views = [];
    this.#materializedViews = [];
    this.#partitionedTables = [];
    this.#sequences = [];

    entities.forEach((entity) => {
      entityOidMapper[entity.oid] = entity;
      if (entity.kindName === "table") this.#tables.push({ schema: entity.schema, name: entity.name });
      else if (entity.kindName === "view") this.#views.push({ schema: entity.schema, name: entity.name });
      else if (entity.kindName === "materialized view") this.#materializedViews.push({ schema: entity.schema, name: entity.name });
      else if (entity.kindName === "partitioned table") this.#partitionedTables.push({ schema: entity.schema, name: entity.name });
    });

    const sequenceRegExp = /nextval\(['"]+(.+?)['"]+::regclass\)/;
    columns.forEach((column) => {
      const match = column.defaultWithTypeCast?.match(sequenceRegExp);
      if (match) {
        const entity = entityOidMapper[column.parentOid];
        this.#sequences.push({ schema: entity.schema, table: entity.name, column: column.name, name: match[1] });
      }
    });
  }

  /** Returns tables from database. Uses cache for fast results. Use `refresh()` method to refresh the cache. */
  async getTables(): Promise<EntityInfo[]> {
    if (this.#tables.length === 0) await this.refresh();
    return this.#tables;
  }

  /** Returns views from database. Uses cache for fast results. Use `refresh()` method to refresh the cache. */
  async getViews(): Promise<EntityInfo[]> {
    if (this.#tables.length === 0) await this.refresh();
    return this.#views;
  }

  /** Returns materialized views from database. Uses cache for fast results. Use `refresh()` method to refresh the cache. */
  async getMaterializedViews(): Promise<EntityInfo[]> {
    if (this.#tables.length === 0) await this.refresh();
    return this.#materializedViews;
  }

  /** Returns partitioned tables from database. Uses cache for fast results. Use `refresh()` method to refresh the cache. */
  async getPartitionedTables(): Promise<EntityInfo[]> {
    if (this.#tables.length === 0) await this.refresh();
    return this.#partitionedTables;
  }

  /** Returns sequences from database. Uses cache for fast results. Use `refresh()` method to refresh the cache. */
  async getSequences(): Promise<SequenceInfo[]> {
    if (this.#sequences.length === 0) await this.refresh();
    return this.#sequences;
  }

  /** Set current value of sequence for each column of all tables based on record with maximum number. If there are no record in the table, the value will be set to 1. */
  async syncSequences(): Promise<void> {
    const sequences = await this.getSequences();
    try {
      await Promise.all(
        sequences.map((seq) =>
          this.client.query(
            escape(
              "SELECT setval($1, (SELECT COALESCE((SELECT %I + 1 FROM %I ORDER BY %I DESC LIMIT 1), 1)), false)",
              seq.column,
              seq.table,
              seq.column
            ),
            [`${seq.schema}.${seq.name}`]
          )
        )
      );
    } catch (error: any) {
      throw await this.#getError(error, "Cannot update sequences");
    }
  }

  /**
   * Truncates all tables and resets their sequences in the database.
   *
   * @param ignore are the list of the tables to ignore.
   */
  async truncate({ ignore = [] }: { ignore?: string[] } = {}): Promise<void> {
    const tables = await this.getTables();
    const ignoreSet = new Set(ignore);

    const tablesToTruncate = tables
      .filter((table) => !ignoreSet.has(`${table.schema}.${table.name}`) && !ignoreSet.has(`${table.name}`))
      .map((table) => `${escape(table.schema)}.${escape(table.name)}`);

    if (tablesToTruncate.length === 0) return;

    try {
      await this.client.query(`TRUNCATE ${tablesToTruncate.join(", ")} RESTART IDENTITY`);
    } catch (error: any) {
      await this.#cleanup();
      throw await this.#getError(error, `Cannot truncate tables`);
    }
  }

  /**
   * Executes given SQL and returns result rows.
   *
   * @typeparam T is type for single row returned by SQL query.
   *
   * @param sql is sql query.
   * @param params are array of parameters to pass query.
   * @returns result rows of the SQL query.
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    await this.connect();
    try {
      const result = await this.client.query(sql, params);
      return result.rows;
    } catch (error: any) {
      throw await this.#getError(error, `Cannot execute SQL query`);
    }
  }

  /**
   * Reads and executes SQL in given file and returns results.
   *
   * @typeparam T is type for single row returned by SQL query.
   *
   * @param file is file to read SQL from.
   * @param params are array of parameters to pass query.
   * @returns result rows of the SQL query.
   */
  async queryFile<T = any>(file: string, params?: any[]): Promise<T[]> {
    try {
      const sql = await readFile(file, { encoding: "utf8" });
      const rows = await this.query(sql, params);
      return rows;
    } catch (error: any) {
      throw await this.#getError(error, `Cannot execute SQL file '${file}'`);
    }
  }
}
