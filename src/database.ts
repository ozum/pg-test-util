import { InternalDataInterface } from "internal-data";
import { VError } from "verror";
import * as knex from "knex";
import * as fs from "fs-extra";
import { getConnectionObject, createKnex } from "./helper";
import { ConnectionConfig, PartialConnectionConfig } from "./types";

const internalData: InternalDataInterface<Database, Internal> = new WeakMap();

type Internal = {
  schemas: Array<string>;
  preError: () => void;
  _tables?: Array<{ schema: string; table: string }>; // [{ schema: 'public', table: 'item' } ...]
  _sequences?: Array<{ schema: string; table: string; column: string; sequence: string }>; // [{ schema: 'public', table: 'Item', column: 'id', sequence: 'Item_id_seq' } ...]
  connection: ConnectionConfig;
  _knex?: knex;
  drop: (name: string) => Promise<void>;
};

export type DatabaseConfig = {
  connection: PartialConnectionConfig;
  schemas?: Array<string>;
  preError: () => void;
  drop: (name: string) => Promise<void>;
};

/**
 * Database class is used for tasks related to individual database such as connecting, querying, getting tables, getting sequences etc.
 *
 * @public
 * @hideconstructor
 */
class Database {
  /**
   * Returns connection parameters object. Fills individual parameters from connection string or vice versa and returns
   * fully filled object.
   *
   * @private
   * @param {PartialConnectionConfig}   [connection]          - Connection string as `postgresql://name:pass@127.0.0.1:5432/template1`
   * @param {Array.<string>}            [schemas=['public']]  - Schemas to include in utility functions.
   * @param {Function}                  preError              - Error function to call before throwing any error.
   * @param {Function}                  drop                  - Function to drop this database. (Because it needs master connection)
   * @returns {Database}                                      - Created object
   */
  constructor({ connection, schemas = ["public"], preError, drop }: DatabaseConfig = {} as DatabaseConfig) {
    const connectionObject = getConnectionObject(connection);

    const internal: Internal = {
      schemas,
      preError,
      drop,
      _tables: undefined, // [{ schema: 'public', table: 'item' } ...]
      _sequences: undefined,
      _knex: undefined,
      connection: connectionObject
    };

    internalData.set(this, internal);
  }

  /**
   * Gets database name.
   *
   * @readonly
   * @type {string}
   */
  get name(): string {
    const internal = internalData.get(this);
    return internal.connection.database;
  }

  /**
   * Gets connection status of database.
   *
   * @readonly
   * @type {boolean}
   */
  get isConnected(): boolean {
    const internal = internalData.get(this);

    return !!internal._knex;
  }

  /**
   * Gets `knex` object for database.
   *
   * @readonly
   * @type {knex}
   */
  get knex(): knex {
    const internal = internalData.get(this);

    if (!internal._knex) {
      internal._knex = createKnex(internal.connection.connectionString);
    }

    return internal._knex;
  }

  /**
   * Disconnects from database.
   *
   * @returns {Promise.<void>} Void promise.
   * @throws Throws error if disconnection fails.
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      const internal = internalData.get(this);

      try {
        await this.knex.destroy();
        delete internal._knex;
      } catch (e) {
        /* istanbul ignore next */
        await internal.preError();
        /* istanbul ignore next */
        throw new VError(e, `Cannot disconnect from '${this.name}' database`);
      }
    }
  }

  /**
   * Clears tables and sequences cache.
   *
   * @returns {void}
   */
  refresh() {
    const internal = internalData.get(this);
    internal._tables = undefined;
    internal._sequences = undefined;
  }

  /**
   * Returns tables from database. Uses cache for fast results. Use `refresh()` method to refresh the cache.
   *
   * @returns {Promise<Array<{ schema: string, table: string }>>} Information about tables.
   * @throws Throws error if query fails.
   */
  async getTables(): Promise<Array<{ schema: string; table: string }>> {
    const internal = internalData.get(this);
    if (!internal._tables) {
      try {
        internal._tables = await this.knex("pg_tables")
          .select("schemaname AS schema", "tablename AS table")
          .whereIn("schemaname", internal.schemas);
      } catch (e) {
        /* istanbul ignore next */
        await internal.preError();
        /* istanbul ignore next */
        throw new VError(e, `Cannot get tables from '${this.name}' database`);
      }
    }

    /* istanbul ignore next */
    return internal._tables || [];
  }

  /**
   * Returns sequences from database. Uses cache for fast results. Use `refresh()` method to refresh the cache.
   *
   * @returns {Promise<Array<{ schema: string, table: string, column: string, sequence: string }>>} Information about sequences
   * @throws Throws error if query fails.
   */
  async getSequences(): Promise<Array<{ schema: string; table: string; column: string; sequence: string }>> {
    const internal = internalData.get(this);

    if (!internal._sequences) {
      try {
        internal._sequences = await this.knex("information_schema.columns")
          .select(
            "table_schema AS schema",
            "table_name AS table",
            "column_name AS column",
            this.knex.raw(
              "regexp_replace(column_default, 'nextval\\([''\"]+(.+\\?)[''\"]+::regclass\\)', '\\1') AS sequence"
            )
          )
          .where("column_default", "like", "nextval(%")
          .whereIn("table_schema", internal.schemas)
          .orderBy("table_schema")
          .orderBy("table_name")
          .orderBy("column_name");
      } catch (e) {
        /* istanbul ignore next */
        await internal.preError();
        /* istanbul ignore next */
        throw new VError(e, `Cannot get sequences from '${this.name}' database`);
      }
    }

    /* istanbul ignore next */
    return internal._sequences || [];
  }

  /**
   * Set current value of sequence for each column of all tables based on record with maximum number. If there are no record in the table, the value will be set to 1.
   *
   * @returns {Promise<void>} - Promise of all queries.
   * @throws Throws error if query fails.
   */
  async updateSequences(): Promise<void> {
    const internal = internalData.get(this);
    const sequences = await this.getSequences();

    try {
      await Promise.all(
        sequences.map(seq =>
          this.knex.raw(
            "SELECT setval('??.??', (SELECT COALESCE((SELECT ?? + 1 FROM ?? ORDER BY ?? DESC LIMIT 1), 1)), false)",
            [seq.schema, seq.sequence, seq.column, seq.table, seq.column]
          )
        )
      );
    } catch (e) {
      /* istanbul ignore next */
      await internal.preError();
      /* istanbul ignore next */
      throw new VError(e, `Cannot update sequences from '${this.name}' database`);
    }
  }

  /**
   * Truncates all tables in database.
   *
   * @param {Array<string>}                 [ignoreTables=[]] - Tables to ignore.
   * @returns {Promise<knex.QueryBuilder>}                    - Promise of all queries.
   * @throws Throws error if query fails.
   */
  async truncate(ignoreTables: Array<string> = []): Promise<knex.QueryBuilder> {
    const internal = internalData.get(this);
    const tables = await this.getTables();
    const ignoreTablesWithSchema = ignoreTables.map(table => table.includes(".") ? table : `public.${ table }` );

    const filteredTables = tables
      .filter(table => !ignoreTablesWithSchema.includes(`${table.schema}.${table.table}`))
      .map(table => `"${table.schema}"."${table.table}"`)
      .join(", ");

    try {
      await this.knex.raw(`TRUNCATE ${filteredTables} RESTART IDENTITY`);
    } catch (e) {
      /* istanbul ignore next */
      await internal.preError();
      /* istanbul ignore next */
      throw new VError(e, `Cannot truncate tables from '${this.name}' database`);
    }
  }

  /**
   * Reads and executes SQL in given file.
   *
   * @param {string}                        file  - File to read SQL from
   * @returns {Promise<knex.QueryBuilder>}        - Promise of SQL query.
   * @throws Throws error if query fails.
   */
  async queryFile(file: string): Promise<knex.QueryBuilder> {
    const internal = internalData.get(this);
    try {
      const sql = await fs.readFile(file, { encoding: "utf8" });
      return this.query(sql);
    } catch (e) {
      await internal.preError();
      throw new VError(e, `Cannot execute given SQL file '${file}' for '${this.name}' database`);
    }
  }

  /**
   * Executes given SQL.
   *
   * @param {string|Array<string>}          sql   - SQL to execute.
   * @returns {Promise<knex.QueryBuilder>}        - Promise of SQL query.
   * @throws Throws error if query fails.
   */
  async query(sql: string | Array<string>): Promise<knex.QueryBuilder> {
    const internal = internalData.get(this);
    if (!sql) {
      await internal.preError();
      throw new Error("Either 'sql' or 'file' parameter must be present.");
    }

    if (Array.isArray(sql)) {
      // Needs serial execution. Cannot do with foreach/await or Promise.all, so manuel loop.
      return sql
        .reduce(
          (previousPromise, query) =>
            previousPromise.then((results: Array<knex.QueryBuilder>) =>
              this.knex.raw(query).then(result => [...results, result.rows])
            ),
          Promise.resolve(([] as any) as knex.QueryBuilder)
        )
        .catch(async (e: Error) => {
          await internal.preError();
          throw new VError(e, `Cannot execute given query array for '${this.name}' database`);
        });
    }

    try {
      const response = await this.knex.raw(sql);
      return response.rows;
    } catch (e) {
      await internal.preError();
      throw new VError(e, `Cannot execute given query for '${this.name}' database`);
    }
  }

  /**
   * Drops database.
   *
   * @returns {Promise<void>} - Void
   * @throws                  - Throws error if drop operation fails.
   */
  async drop() {
    const internal = internalData.get(this);
    await internal.drop(this.name);
  }
}

export default Database;
