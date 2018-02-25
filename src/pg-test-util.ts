import { VError } from "verror";
import { Client, QueryResult, types } from "pg";
import { InternalDataInterface } from "internal-data";
import * as knex from "knex";
import Database from "./database";
import * as escape from "pg-escape";
import * as Dotenv from "dotenv";
import { getConnectionObject } from "./helper";

import { ConnectionConfig, PartialConnectionConfig } from "./types/index";

const internalData: InternalDataInterface<PgTestUtil, Internal> = new WeakMap();

Dotenv.config();

// Prevent pg returning numbers as string. See: https://github.com/brianc/node-postgres/pull/353
types.setTypeParser(20, (value: string): number => parseInt(value, 10));
types.setTypeParser(1700, (value: string): number => parseFloat(value));

/**
 * Cleanup tasks that should be done before throwing error. Must be called before every throw.
 *
 * @private
 * @param {PgTestUtil} obj - `PgTestUtil` object to act upon.
 * @returns {void}
 * @throws                 - Throws error if some of the tasks fail.
 */
async function preError(obj: PgTestUtil) {
  const internal = internalData.get(obj);

  if (internal.disconnectOnError) {
    try {
      await obj.disconnectAll();
    } catch (e) {
      /* istanbul ignore next */
      throw new VError(
        e,
        "Cannot disconnect all databases in 'preError' catch function. As a result original catch block which called this catch function cannot throw its original message."
      );
    }
  }
}

/**
 * Queries master database.
 *
 * @private
 * @param {PgTestUtil}              obj   - `PgTestUtil` object to act upon.
 * @param {string}                  sql   - SQL query to execute on master database.
 * @returns {Promise<QueryResult>}        - Query result.
 * @throws                                - Throws error if query fails.
 */
async function masterQuery(obj: PgTestUtil, sql: string): Promise<QueryResult> {
  const internal = internalData.get(obj);

  if (!internal.masterClient) {
    try {
      internal.masterClient = new Client({ connectionString: internal.connection.connectionString });
      await internal.masterClient.connect();
    } catch (e) {
      await preError(obj);
      throw new VError(e, `Cannot connect to master database: ${internal.connection.database}`);
    }
  }

  try {
    const result = await internal.masterClient.query(sql);
    return result;
  } catch (e) {
    await preError(obj);
    throw new VError(e, `Cannot query master database: ${internal.connection.database}`);
  }
}

type Internal = {
  masterClient?: Client;
  baseName: string;
  dropOnlyCreated: boolean;
  createdDatabases: Array<string>;
  databases: { [index: string]: Database };
  createdUsers: { [index: string]: string }; // { user1: pass1 ...}
  defaultDatabase: string;
  disconnectOnError: boolean;
  childPreError: () => void;
  childDrop: (name: string) => Promise<void>;
  connection: ConnectionConfig;
};

export type PgTestUtilConfig = {
  baseName?: string;
  connection?: PartialConnectionConfig;
  defaultDatabase?: string;
  dropOnlyCreated?: boolean;
  disconnectOnError?: boolean;
};

/**
 * PgTestUtil class is used to perform PostgreSQL operations related to unit testing such as create database, truncate database and
 * drop database etc.
 *
 * @public
 */
class PgTestUtil {
  /**
   * Creates an instance of PgTestUtil.
   *
   * @param {PgTestUtilConfig}        [config]                    - Configuration
   * @param {string}                  [config.baseName='test-db'] - Base name to use if database name is provided during database creation.
   * @param {PartialConnectionConfig} [config.connection]         - Connection parameters for connecting master database. If not provided, `process.env.PG_TEST_CONNECTION_STRING` is used.
   * @param {string}                  [defaultDatabase]           - Default database name to use in queries. If not provided, first created database is used.
   * @param {boolean}                 [dropOnlyCreated=true]      - If true, `drop` method does not drop databases which are not created by this object instance.
   * @param {boolean}                 [disconnectOnError=false]   - Disconnects from all databases on error caused by this instance. (Should not be used in unit tests. Disconnect or drop in `afterAll` method of testing library.)
   * @returns {PgTestUtil}                                        - Instance of object
   */
  constructor(
    {
      baseName = "test-db",
      connection,
      defaultDatabase,
      dropOnlyCreated = true,
      disconnectOnError = false
    }: PgTestUtilConfig = {} as PgTestUtilConfig
  ) {
    const connectionParams = getConnectionObject({
      connectionString: process.env.PG_TEST_CONNECTION_STRING,
      ...connection
    });

    const internal: Internal = {
      baseName,
      dropOnlyCreated,
      defaultDatabase,
      disconnectOnError,
      masterClient: undefined,
      createdDatabases: [],
      databases: {},
      createdUsers: {}, // { user1: pass1 ...}
      childPreError: preError.bind(null, this),
      childDrop: this.dropDatabase.bind(this),
      connection: connectionParams
    };

    internalData.set(this, internal);
  }

  /**
   * Fetches and returns list of databases from server.
   *
   * @returns {Promise<Array<string>>}  - List of databases.
   * @throws  {Error}                   - Throws error if it cannot get databases from server.
   */
  async getDatabaseListFromServer(): Promise<Array<string>> {
    try {
      const result = await masterQuery(this, "SELECT datname FROM pg_database");
      return result.rows.map(row => row.datname);
    } catch (e) {
      /* istanbul ignore next */
      await preError(this);
      /* istanbul ignore next */
      throw new VError(e, "Cannot get list of databases from server.");
    }
  }

  /**
   * Gets connection status.
   *
   * @readonly
   * @type {boolean}
   */
  get isConnected(): boolean {
    const internal = internalData.get(this);
    return !!internal.masterClient;
  }

  /**
   * Gets default database name which determined algorithm below:
   * 1. `defaultDatabase` name provided during instance creation.
   * 2. If only one database is created, created database.
   * 3. Cannot be determined a default database name.
   *
   * @readonly
   * @type {string}
   * @throws Throws error if no default database name can be determinded.
   */
  get defaultDatabaseName(): string {
    const internal = internalData.get(this);
    const databases = internal.createdDatabases;
    const firstDatabase = databases[0];
    const defaultDB = internal.defaultDatabase || (databases.length === 1 ? firstDatabase : undefined);

    if (!defaultDB) {
      preError(this);
      throw new VError(
        "Either default database should be provided or only one database must be created (to be used as a default db)."
      );
    }
    return defaultDB;
  }

  /**
   * Generates a unique database name. Uniqueness of database name is not generated useing an advanced
   * algorithm or technique. Simply epoch time is used.
   *
   * @returns {string} - Unique database name
   */
  generateName(): string {
    const internal = internalData.get(this);
    const dbNo = new Date().getTime() - 1518518200000;
    return `${internal.baseName}-${dbNo}`;
  }

  /**
   * Returns `Database` instance object for given database name. Also connects to database if it is not connected.
   * If no connection details are provided, default database is returned using same connection parameters as master database.
   *
   * @param   {string}    [name=this.defaultDatabaseName] - Database name to get instance for.
   * @returns {Database}                                  - `Database` instance for given database name.
   * @throws                                              - Throws error if database cannot be connected.
   */
  getDatabase(name = this.defaultDatabaseName): Database {
    const internal = internalData.get(this);

    if (!internal.databases[name]) {
      internal.databases[name] = new Database({
        preError: internal.childPreError,
        drop: internal.childDrop,
        connection: {
          ...internal.connection,
          database: name,
          connectionString: undefined
        }
      });
    }

    return internal.databases[name];
  }

  /**
   * Disconnects from master database.
   *
   * @returns {Promise<void>}        - Query result.
   * @throws                         - Throws error if query fails.
   */
  async disconnect(): Promise<void> {
    const internal = internalData.get(this);

    if (internal.masterClient) {
      try {
        await internal.masterClient.end();
        delete internal.masterClient;
      } catch (e) {
        /* istanbul ignore next */
        await preError(this);
        /* istanbul ignore next */
        throw new VError(e, `Cannot disconnect from master database: ${internal.connection.database}`);
      }
    }
  }

  /**
   * Disconnects from all databases.
   *
   * @param {Object}  [config]              - Configuration
   * @param {boolean} [config.master=true]  - If true, it disconnects from master database too.
   * @returns {Promise<void[]>}             - Void promise
   * @throws                                - Throws error if cannot disconnect from databases.
   */
  async disconnectAll({ master = true } = {}): Promise<void[]> {
    const internal = internalData.get(this);
    const promises: (Promise<void>)[] = Object.keys(internal.databases).map(dbName =>
      internal.databases[dbName].disconnect()
    );

    if (master) {
      promises.push(this.disconnect());
    }

    return Promise.all(promises);
  }

  /**
   * Creates a new database user.
   *
   * @param {string}                  user      - User name to create
   * @param {string}                  password  - Password for created user.
   * @returns {Promise<QueryResult>}            - Query result promise.
   * @throws                                    - Throws error if user cannot be created.
   */
  async createUser(user: string, password: string): Promise<QueryResult> {
    const internal = internalData.get(this);
    const sql = escape(
      "DO $body$ BEGIN CREATE ROLE %I LOGIN PASSWORD %L; EXCEPTION WHEN others THEN RAISE NOTICE 'User exists, not re-creating'; END $body$;",
      user,
      password
    );

    const result = await masterQuery(this, sql);
    internal.createdUsers[user] = password;
    return result;
  }

  /**
   * Returns database users.
   *
   * @returns {Promise<QueryResult>}  - Database users as [{ name: 'user1' }, ...]
   * @throws                          - Throws error if quer fails to get users.
   */
  async getUsers(): Promise<Array<{ name: string }>> {
    const internal = internalData.get(this);
    const result = await masterQuery(this, 'SELECT u.usename AS "name" FROM pg_catalog.pg_user u ORDER BY u.usename');
    return result.rows;
  }

  /**
   * Drops database user. If
   *
   * @param   {string}                user                                                    - User name to drop
   * @param   {Object}                [config]                                                - Configuration
   * @param   {boolean}               [config.dropOnlyCreated=`dropOnlyCreated` of instance]  - Safety precaution. If true, only databases created by this instance is dropped.
   * @returns {Promise<void>}                                                                 - void.
   * @throws                                                                                  - Throws error if user cannot be dropped.
   */
  async dropUser(user: string, { dropOnlyCreated = internalData.get(this).dropOnlyCreated } = {}): Promise<void> {
    const internal = internalData.get(this);
    const sql = escape("DROP ROLE IF EXISTS %I", user);
    if (!internal.createdUsers[user] && dropOnlyCreated) {
      await preError(this);
      const message =
        `'${user}' user is not created by this instance. 'dropOnlyCreated' parameter may be set to false` +
        " on function level or on constructor level to drop this user.";
      throw new VError(message);
    }

    try {
      const result = await masterQuery(this, sql);
      delete internal.createdUsers[user];
    } catch (e) {
      await preError(this);
      throw new VError(e, `Cannot drop ${user} user`);
    }
  }

  /**
   * Drops all users created by this instance.
   *
   * @returns {Promise<void>}           - Void
   * @throws                            - Throws error if any user cannot be dropped.
   */
  async dropAllUsers(): Promise<void> {
    const internal = internalData.get(this);
    await Promise.all(Object.keys(internal.createdUsers).map(user => this.dropUser(user)));
  }

  /**
   * Creates a database. If name is not provided generates a name using `baseName` from constructor and part of epoch time.
   *
   * @param   {Object}  [config]                          - Configuration
   * @param   {string}  [config.name=this.generateName()] - Database name
   * @param   {string}  [config.encoding='UTF8']          - Database encoding
   * @param   {string}  [config.template='template0']     - Database template to use.
   * @param   {string}  [config.sql]                      - SQL query to execute on database after it is created.
   * @param   {string}  [config.file]                     - SQL query file to execute on database after it is created.
   * @param   {boolean} [config.drop=false]               - If true, database is dropped before create command.
   * @returns {Promise<Database>}                         - `Database` object representing created database.
   * @throws                                              - Throws error if database creation fails.
   */
  async createDatabase({
    name = this.generateName(),
    encoding = "UTF8",
    template = "template0",
    sql,
    file,
    drop = false
  }: {
    name?: string;
    encoding?: string;
    template?: string;
    sql?: string;
    file?: string;
    drop?: boolean;
  } = {}): Promise<Database> {
    const internal = internalData.get(this);
    const createDBSQL = escape("CREATE DATABASE %I WITH ENCODING = %L TEMPLATE = %I;", name, encoding, template);

    if (drop) {
      await this.dropDatabase(name, { dropOnlyCreated: false });
    }

    await masterQuery(this, createDBSQL);
    internal.createdDatabases.push(name);
    const database = this.getDatabase(name);

    if (file) {
      await database.queryFile(file);
    }
    if (sql) {
      await database.query(sql);
    }

    return database;
  }

  /**
   * Copies a given database with a new name.
   *
   * @param   {Object}                config                          - Configuration
   * @param   {string | Database}     [from=this.defaultDatabaseName] - Source database name or `Database` instance to copy from.
   * @param   {string | Database}     to                              - Target database name or `Database` instance to copy to.
   * @param   {boolean}               [drop=false]                    - Drop target database before copy if exists.
   * @returns {Promise<Database>}                                     - Query result.
   * @throws                                                          - Throws error if copy task fails.
   */
  async copyDatabase({
    from = this.defaultDatabaseName,
    to,
    drop = false
  }: {
    from?: string | Database;
    to: string | Database;
    drop?: boolean;
  }): Promise<Database> {
    const internal = internalData.get(this);
    const [fromName, toName] = [from instanceof Database ? from.name : from, to instanceof Database ? to.name : to];
    try {
      if (drop) {
        await this.dropDatabase(toName);
      }
      await this.getDatabase(fromName).disconnect();
      await masterQuery(this, escape("CREATE DATABASE %I template %I", toName, fromName));
      internal.createdDatabases.push(toName);
    } catch (e) {
      await preError(this);
      throw new VError(e, `Cannot copy from ${fromName} to ${toName} database`);
    }
    return this.getDatabase(toName);
  }

  /**
   * Drops given database. To ensure the task, drops all connections to the database beforehand.
   * If `dropOnlyCreated` is true and database is not created by this instance, throws error.
   *
   * @param   {string}        [database=this.defaultDatabaseName]                     - Database name or `Database` instance to drop.
   * @param   {Object}        [config]                                                - Configuration.
   * @param   {boolean}       [config.dropOnlyCreated=`dropOnlyCreated` of instance]  - Safety precaution. If true, only databases created by this instance is dropped.
   * @returns {Promise<void>}                                                         - Void
   * @throws                                                                          - Throws error if database cannot be dropped.
   */
  async dropDatabase(
    database: string | Database = this.defaultDatabaseName,
    { dropOnlyCreated = internalData.get(this).dropOnlyCreated } = {}
  ): Promise<void> {
    const internal = internalData.get(this);
    const name = database instanceof Database ? database.name : database;
    const createdDatabaseIndex = internal.createdDatabases.indexOf(name);
    if (createdDatabaseIndex === -1 && dropOnlyCreated) {
      await preError(this);
      const message =
        `'${name}' database is not created by this instance. 'dropOnlyCreated' parameter may be set to false` +
        " on function level or on constructor level to drop this database.";
      throw new VError(message);
    }

    if (internal.databases[name]) {
      const databaseObj = database instanceof Database ? database : this.getDatabase(name);
      await databaseObj.disconnect();
      delete internal.databases[name];
    }

    if (createdDatabaseIndex > -1) {
      internal.createdDatabases.splice(createdDatabaseIndex, 1); // Delete from array
    }

    try {
      await masterQuery(this, escape("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=%L;", name));
      await masterQuery(this, escape("DROP DATABASE IF EXISTS %I;", name));
    } catch (e) {
      await preError(this);
      throw new VError(e, `Cannot drop ${name} database`);
    }
  }

  /**
   * Drops all databases created by this instance.
   *
   * @param   {Object}  [config]          - Configuration
   * @param   {boolean} [disconnect=true] - If true disconnects from master database.
   * @returns {Promise<void>}             - Void
   * @throws                              - Throws error if any database cannot be dropped.
   */
  async dropAllDatabases({ disconnect = true } = {}): Promise<void> {
    const internal = internalData.get(this);
    await Promise.all(internal.createdDatabases.map(dbName => this.dropDatabase(dbName)));

    if (disconnect) {
      await this.disconnect();
    }
  }

  /**
   * Drops all items created by this instance.
   *
   * @param   {Object}  [config]            - Configuration
   * @param   {boolean} [disconnect=true]   - If true disconnects from master database.
   * @returns {Promise<void>}               - Void
   * @throws                                - Throws error if any item cannot be dropped.
   */
  async dropAll({ disconnect = true } = {}): Promise<void> {
    await Promise.all([this.dropAllDatabases({ disconnect }), this.dropAllUsers()]);
  }
}

export default PgTestUtil;
