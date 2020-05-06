/* eslint-disable no-await-in-loop, no-restricted-syntax */
import { VError } from "verror";
import * as knex from "knex";
import * as fs from "fs-extra";
import { getConnectionObject, createKnex } from "./helper";
import { ConnectionConfig, ConnectionConfigWithObject, ConnectionConfigWithString, TableInfo, SequenceInfo } from "./types";

/** @ignore */
export type DatabaseConstructorArgs = {
  connection: ConnectionConfigWithObject | ConnectionConfigWithString;
  schemas?: Array<string>;
  preError: () => void;
  drop: () => Promise<void>;
};

/**
 * Database class is used for tasks related to individual database such as connecting, querying, getting tables, getting sequences etc.
 */
export default class Database {
  /** @ignore */
  constructor({ connection, schemas = ["public"], preError, drop }: DatabaseConstructorArgs) {
    this.schemas = schemas;
    this.preError = preError;
    this.drop = drop;
    this.connection = getConnectionObject(connection);
  }

  /** Schemas to be used in db structure related queries. */
  private schemas: Array<string>;

  /** Cache of list of tables and their schemas in database i.e. `[{ schema: 'public', table: 'item' } ...]` */
  private _tables?: TableInfo[];

  /** Sequences of the database i.e. `[{ schema: 'public', table: 'Item', column: 'id', sequence: 'Item_id_seq' } ...]` */
  private _sequences?: SequenceInfo[];

  /** Connection configuration for the database. */
  private connection: ConnectionConfig;

  /** knex object to use in queries. */
  private _knex?: knex;

  /** Whether this database is disconnected explicitly. */
  private _isDisconnected = false;

  /** Function to execute before throwing error.  */
  private preError: () => void;

  /** Function to drop this database. `DROP DATABSE` sql query must be executed from another database, so this function should be passed to constructor. */
  public drop: () => Promise<void>;

  /** Database name. */
  get name(): string {
    return this.connection.database;
  }

  /** Whether database is connected or not. */
  get isConnected(): boolean {
    return this._knex !== undefined;
  }

  /** `knex` object for database. It may be used to build queries easily. */
  get knex(): knex {
    if (!this._knex) {
      this._knex = createKnex(this.connection.connectionString);
    }

    return this._knex;
  }

  /** Disconnects from database. */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.knex.destroy();
        delete this._knex;
      } catch (e) {
        /* istanbul ignore next */
        await this.preError();
        /* istanbul ignore next */
        throw new VError(e, `Cannot disconnect from '${this.name}' database`);
      }
    }
    this._isDisconnected = true;
  }

  /** Clears tables and sequences cache. */
  refresh(): void {
    this._tables = undefined;
    this._sequences = undefined;
  }

  /**
   * Returns tables from database. Uses cache for fast results. Use `refresh()` method to refresh the cache.
   *
   * @returns information about tables.
   */
  async getTables(): Promise<TableInfo[]> {
    if (!this._tables) {
      try {
        this._tables = await this.knex("pg_tables")
          .select("schemaname AS schema", "tablename AS table")
          .whereIn("schemaname", this.schemas);
      } catch (e) {
        /* istanbul ignore next */
        await this.preError();
        /* istanbul ignore next */
        throw new VError(e, `Cannot get tables from '${this.name}' database`);
      }
    }

    /* istanbul ignore next */
    return this._tables || [];
  }

  /**
   * Returns sequences from database. Uses cache for fast results. Use `refresh()` method to refresh the cache.
   *
   * @returns information about sequences
   */
  async getSequences(): Promise<SequenceInfo[]> {
    if (!this._sequences) {
      try {
        this._sequences = await this.knex("information_schema.columns")
          .select(
            "table_schema AS schema",
            "table_name AS table",
            "column_name AS column",
            this.knex.raw("regexp_replace(column_default, 'nextval\\([''\"]+(.+\\?)[''\"]+::regclass\\)', '\\1') AS sequence")
          )
          .where("column_default", "like", "nextval(%")
          .whereIn("table_schema", this.schemas)
          .orderBy("table_schema")
          .orderBy("table_name")
          .orderBy("column_name");
      } catch (e) {
        /* istanbul ignore next */
        await this.preError();
        /* istanbul ignore next */
        throw new VError(e, `Cannot get sequences from '${this.name}' database`);
      }
    }

    /* istanbul ignore next */
    return this._sequences || [];
  }

  /** Set current value of sequence for each column of all tables based on record with maximum number. If there are no record in the table, the value will be set to 1. */
  async updateSequences(): Promise<void> {
    const sequences = await this.getSequences();

    try {
      await Promise.all(
        sequences.map((seq) =>
          this.knex.raw("SELECT setval('??.??', (SELECT COALESCE((SELECT ?? + 1 FROM ?? ORDER BY ?? DESC LIMIT 1), 1)), false)", [
            seq.schema,
            seq.sequence,
            seq.column,
            seq.table,
            seq.column,
          ])
        )
      );
    } catch (e) {
      /* istanbul ignore next */
      await this.preError();
      /* istanbul ignore next */
      throw new VError(e, `Cannot update sequences from '${this.name}' database`);
    }
  }

  /**
   * Truncates all tables in database.
   *
   * @param ignoreTables are list of tables to ignore.
   */
  async truncate(ignoreTables: Array<string> = []): Promise<void> {
    const tables = await this.getTables();
    const ignoreTablesWithSchema = ignoreTables.map((table) => (table.includes(".") ? table : `public.${table}`));

    const filteredTables = tables
      .filter((table) => !ignoreTablesWithSchema.includes(`${table.schema}.${table.table}`))
      .map((table) => `"${table.schema}"."${table.table}"`)
      .join(", ");

    try {
      await this.knex.raw(`TRUNCATE ${filteredTables} RESTART IDENTITY`);
    } catch (e) {
      /* istanbul ignore next */
      await this.preError();
      /* istanbul ignore next */
      throw new VError(e, `Cannot truncate tables from '${this.name}' database`);
    }
  }

  /**
   * Reads and executes SQL in given file and returns results.
   *
   * @typeparam T is type for single row returned by SQL query.
   * @param file is file to read SQL from.
   * @returns result rows of the SQL query.
   */
  async queryFile<T extends any>(file: string): Promise<T[]> {
    try {
      const sql = await fs.readFile(file, { encoding: "utf8" });
      return this.query(sql);
    } catch (e) {
      await this.preError();
      throw new VError(e, `Cannot execute given SQL file '${file}' for '${this.name}' database`);
    }
  }

  /**
   * Executes given SQL and returns results.
   *
   * @typeparam T is type for single row returned by SQL query.
   * @param sql is sql query or array of sql queries to execute.
   * @returns result rows of the SQL query. If multiple queries are given results are concatenated into single array.
   */
  async query<T extends any>(sql: string | Array<string>): Promise<T[]> {
    if (this._isDisconnected) {
      await this.preError();
      throw new Error("Database is explicitly disconnected by this library.");
    }

    if (!sql) {
      await this.preError();
      throw new Error("Either 'sql' or 'file' parameter must be present.");
    }

    if (Array.isArray(sql)) {
      const results = [];

      for (const sqlQuery of sql) {
        try {
          const response = await this.knex.raw(sqlQuery);
          results.push(response.rows); // Must be serial execution. Cannot use Promise.all()
        } catch (e) {
          await this.preError();
          throw new VError(e, `Cannot execute given query array for '${this.name}' database`);
        }
      }

      return results;
    }

    try {
      const response = await this.knex.raw(sql);
      return response.rows;
    } catch (e) {
      await this.preError();
      throw new VError(e, `Cannot execute given query for '${this.name}' database`);
    }
  }

  // /** Drops database. */
  // async drop(): Promise<void> {
  //   return this._drop(this.name);
  // }
}
