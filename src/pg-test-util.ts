import { VError } from "verror";
import { Client, QueryResult, types } from "pg";
import escape from "pg-escape";
import * as Dotenv from "dotenv";
import Database from "./database";
import { getConnectionObject } from "./helper";
import { ConnectionConfig, ConnectionConfigWithString, ConnectionConfigWithObject } from "./types/index";

Dotenv.config();

// Prevent pg returning numbers as string. See: https://github.com/brianc/node-postgres/pull/353
types.setTypeParser(20, (value: string): number => parseInt(value, 10));
types.setTypeParser(1700, (value: string): number => parseFloat(value));

/** @ignore */
export type PgTestUtilConstructorArgs = {
  baseName?: string;
  connection: ConnectionConfigWithString | ConnectionConfigWithObject;
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
export default class PgTestUtil {
  /**
   * Creates an instance of PgTestUtil.
   *
   * @param baseName is base name to use if database name is provided during database creation.
   * @param connection is connection parameters for connecting master database. If not provided, `process.env.PG_TEST_CONNECTION_STRING` is used.
   * @param defaultDatabase is fefault database name to use in queries. If not provided, first created database is used.
   * @param dropOnlyCreated if true, `drop` method does not drop databases which are not created by this object instance.
   * @param disconnectOnError is whether to disconnects from all databases on error caused by this instance. (Should not be used in unit tests. Disconnect or drop in `afterAll` method of testing library.)
   */
  constructor(
    {
      baseName = "test-db",
      connection,
      defaultDatabase,
      dropOnlyCreated = true,
      disconnectOnError = false,
    }: PgTestUtilConstructorArgs = {} as PgTestUtilConstructorArgs
  ) {
    this.baseName = baseName;
    this.dropOnlyCreated = dropOnlyCreated;
    this.defaultDatabase = defaultDatabase;
    this.disconnectOnError = disconnectOnError;
    this.connection = getConnectionObject({
      connectionString: process.env.PG_TEST_CONNECTION_STRING,
      ...connection,
    });
  }

  private baseName: string;
  private dropOnlyCreated: boolean;
  private defaultDatabase?: string;
  private disconnectOnError: boolean;
  private masterClient?: Client;
  private createdDatabases: string[] = [];
  private databases: Record<string, Database> = {};
  private createdUsers: Record<string, string> = {}; // Keys are usernames, values are passwords { user1: pass1 ...}
  private connection: ConnectionConfig;

  /** Cleans up tasks that should be done before throwing error. Must be called before every throw. */
  private async preError(): Promise<void> {
    if (this.disconnectOnError) {
      try {
        await this.disconnectAll();
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
   * @param sql is SQL query to execute on master database.
   * @returns row of query result.
   */
  private async masterQuery(sql: string): Promise<QueryResult> {
    if (!this.masterClient) {
      try {
        this.masterClient = new Client({ connectionString: this.connection.connectionString });
        await this.masterClient.connect();
      } catch (e) {
        await this.preError();
        throw new VError(e, `Cannot connect to master database: ${this.connection.database}`);
      }
    }

    try {
      const result = await this.masterClient.query(sql);
      return result;
    } catch (e) {
      await this.preError();
      throw new VError(e, `Cannot query master database: ${this.connection.database}`);
    }
  }

  /**
   * Fetches and returns list of databases from server.
   *
   * @returns list of databases.
   */
  async getDatabaseListFromServer(): Promise<Array<string>> {
    try {
      const result = await this.masterQuery("SELECT datname FROM pg_database");
      return result.rows.map(row => row.datname);
    } catch (e) {
      /* istanbul ignore next */
      await this.preError();
      /* istanbul ignore next */
      throw new VError(e, "Cannot get list of databases from server.");
    }
  }

  /** Connection status. */
  get isConnected(): boolean {
    return this.masterClient !== undefined;
  }

  /**
   * Default database name which is determined by algorithm below:
   * 1. `defaultDatabase` name provided during instance creation.
   * 2. If only one database is created, created database.
   * 3. Cannot be determined a default database name.
   *
   * @throws Throws error if no default database name can be determinded.
   */
  get defaultDatabaseName(): string {
    const databases = this.createdDatabases;
    const firstDatabase = databases[0];
    const defaultDB = this.defaultDatabase || (databases.length === 1 ? firstDatabase : undefined);

    if (!defaultDB) {
      this.preError();
      throw new VError("Either default database should be provided or only one database must be created (to be used as a default db).");
    }
    return defaultDB;
  }

  /**
   * Generates a unique database name. Uniqueness of database name is not generated useing an advanced
   * algorithm or technique. Simply epoch time is used.
   *
   * @returns unique database name
   */
  generateName(): string {
    const dbNo = new Date().getTime() - 1518518200000;
    return `${this.baseName}-${dbNo}`;
  }

  /**
   * Returns `Database` instance object for given database name. Also connects to database if it is not connected.
   * If no connection details are provided, default database is returned using same connection parameters as master database.
   *
   * @param name is database name to get instance for. `defaultDatabaseName` is used by default.
   * @returns [[Database]] instance for given database name.
   */
  getDatabase(name = this.defaultDatabaseName): Database {
    if (!this.databases[name]) {
      this.databases[name] = new Database({
        preError: () => this.preError(),
        drop: () => this.dropDatabase(name),
        connection: {
          ...this.connection,
          database: name,
          connectionString: undefined,
        },
      });
    }

    return this.databases[name];
  }

  /** Disconnects from master database. */
  async disconnect(): Promise<void> {
    if (this.masterClient) {
      try {
        await this.masterClient.end();
        delete this.masterClient;
      } catch (e) {
        /* istanbul ignore next */
        await this.preError();
        /* istanbul ignore next */
        throw new VError(e, `Cannot disconnect from master database: ${this.connection.database}`);
      }
    }
  }

  /**
   * Disconnects from all databases.
   *
   * @param config is configuration
   * @param config.master whether to disconnect from master database.
   */
  async disconnectAll({ master = true } = {}): Promise<void[]> {
    const promises: (Promise<void>)[] = Object.keys(this.databases).map(dbName => this.databases[dbName].disconnect());

    if (master) {
      promises.push(this.disconnect());
    }

    return Promise.all(promises);
  }

  /**
   * Creates a new database user.
   *
   * @param user is user name to create
   * @param password is password for created user.
   * @returns query result.
   */
  async createUser(user: string, password: string): Promise<QueryResult> {
    const sql = escape(
      "DO $body$ BEGIN CREATE ROLE %I LOGIN PASSWORD %L; EXCEPTION WHEN others THEN RAISE NOTICE 'User exists, not re-creating'; END $body$;",
      user,
      password
    );

    const result = await this.masterQuery(sql);
    this.createdUsers[user] = password;
    return result;
  }

  /**
   * Returns database users.
   *
   * @returns database users as [{ name: 'user1' }, ...]
   */
  async getUsers(): Promise<Array<{ name: string }>> {
    const result = await this.masterQuery('SELECT u.usename AS "name" FROM pg_catalog.pg_user u ORDER BY u.usename');
    return result.rows;
  }

  /**
   * Drops database user.
   *
   * @param user is user name to drop.
   * @param config is configuration
   * @param config.dropOnlyCreated is a safety precaution. If true, only users created by this instance is dropped.
   */
  async dropUser(user: string, { dropOnlyCreated = this.dropOnlyCreated } = {}): Promise<void> {
    const sql = escape("DROP ROLE IF EXISTS %I", user);
    if (!this.createdUsers[user] && dropOnlyCreated) {
      await this.preError();
      const message =
        `'${user}' user is not created by this instance. 'dropOnlyCreated' parameter may be set to false` +
        " on function level or on constructor level to drop this user.";
      throw new VError(message);
    }

    try {
      await this.masterQuery(sql);
      delete this.createdUsers[user];
    } catch (e) {
      await this.preError();
      throw new VError(e, `Cannot drop ${user} user`);
    }
  }

  /** Drops all users created by this instance. */
  async dropAllUsers(): Promise<void> {
    await Promise.all(Object.keys(this.createdUsers).map(user => this.dropUser(user)));
  }

  /**
   * Creates a database. If name is not provided generates a name using `baseName` from constructor and part of epoch time.
   *
   * @param config is configuration
   * @param config.name is database name
   * @param config.encoding is database encoding
   * @param config.template is database template to use.
   * @param config.sql is SQL query to execute on database after it is created.
   * @param config.file is SQL query file to execute on database after it is created.
   * @param config.drop is whether to drop database before create command.
   * @returns [[Database]] object representing created database.
   */
  async createDatabase({
    name = this.generateName(),
    encoding = "UTF8",
    template = "template0",
    sql,
    file,
    drop = false,
  }: {
    name?: string;
    encoding?: string;
    template?: string;
    sql?: string;
    file?: string;
    drop?: boolean;
  } = {}): Promise<Database> {
    const createDBSQL = escape("CREATE DATABASE %I WITH ENCODING = %L TEMPLATE = %I;", name, encoding, template);

    if (drop) {
      await this.dropDatabase(name, { dropOnlyCreated: false });
    }

    await this.masterQuery(createDBSQL);

    this.createdDatabases.push(name);
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
   * @param config is configuration.
   * @param config.from is source database name or [[Database]] instance to copy from.
   * @param config.to is target database name or [[Database]] instance to copy to.
   * @param config.drop is whether to drop target database before copy.
   * @returns [[Database]] object.
   */
  async copyDatabase({
    from = this.defaultDatabaseName,
    to,
    drop = false,
  }: {
    from?: string | Database;
    to: string | Database;
    drop?: boolean;
  }): Promise<Database> {
    const [fromName, toName] = [from instanceof Database ? from.name : from, to instanceof Database ? to.name : to];
    try {
      if (drop) {
        await this.dropDatabase(toName);
      }
      await this.getDatabase(fromName).disconnect();
      await this.masterQuery(escape("CREATE DATABASE %I template %I", toName, fromName));
      this.createdDatabases.push(toName);
    } catch (e) {
      await this.preError();
      throw new VError(e, `Cannot copy from ${fromName} to ${toName} database`);
    }
    return this.getDatabase(toName);
  }

  /**
   * Drops given database. To ensure the task, drops all connections to the database beforehand.
   * If `dropOnlyCreated` is true and database is not created by this instance, throws error.
   *
   * @param database is database name or `Database` instance to drop.
   * @param config is configuration.
   * @param config.dropOnlyCreated is a safety precaution. If true, only databases created by this instance is dropped.
   */
  async dropDatabase(
    database: string | Database = this.defaultDatabaseName,
    { dropOnlyCreated = this.dropOnlyCreated } = {}
  ): Promise<void> {
    const name = database instanceof Database ? database.name : database;
    const createdDatabaseIndex = this.createdDatabases.indexOf(name);
    if (createdDatabaseIndex === -1 && dropOnlyCreated) {
      await this.preError();
      const message =
        `'${name}' database is not created by this instance. 'dropOnlyCreated' parameter may be set to false` +
        " on function level or on constructor level to drop this database.";
      throw new VError(message);
    }

    if (this.databases[name]) {
      const databaseObj = database instanceof Database ? database : this.getDatabase(name);
      await databaseObj.disconnect();
      delete this.databases[name];
    }

    if (createdDatabaseIndex > -1) {
      this.createdDatabases.splice(createdDatabaseIndex, 1); // Delete from array
    }

    try {
      await this.masterQuery(escape("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=%L;", name));
      await this.masterQuery(escape("DROP DATABASE IF EXISTS %I;", name));
    } catch (e) {
      await this.preError();
      throw new VError(e, `Cannot drop ${name} database`);
    }
  }

  /**
   * Drops all databases created by this instance.
   *
   * @param config is configuration.
   * @param config.disconnect is whether to disconnect from master database.
   */
  async dropAllDatabases({ disconnect = true } = {}): Promise<void> {
    await Promise.all(this.createdDatabases.map(dbName => this.dropDatabase(dbName)));

    if (disconnect) {
      await this.disconnect();
    }
  }

  /**
   * Drops all items created by this instance.
   *
   * @param config is configuration.
   * @param disconnect is whether to disconnect from master database.
   */
  async dropAll({ disconnect = true } = {}): Promise<void> {
    await Promise.all([this.dropAllDatabases({ disconnect }), this.dropAllUsers()]);
  }
}
