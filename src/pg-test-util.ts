import { Client, ClientConfig } from "pg";
import VError from "verror";
import escape = require("pg-escape");
import Database from "./database";
import { getConnectionConfig } from "./utils/get-connection-config";

/** Options */
export interface Options {
  /** Drop only objects created by this instance. */
  safe?: boolean;
  /** Prefix to be used when creating new databases. */
  baseName?: string;
  /** Whether to drop all created objects if error is thorwn. */
  cleanupOnError?: boolean;
  /** Admin database name to connect. To create other databases we need to connect a database. */
  database?: string;
}

/** PgTestUtil class is used to perform PostgreSQL operations related to unit testing such as create database, truncate database and drop database etc. */
export default class PgTestUtil {
  readonly #adminClient: Client;
  readonly #clientConfig: ClientConfig;
  readonly #safe: boolean;
  readonly #baseName: string;
  #databases: Record<string, Database> = {};
  #createdDatabaseNames: string[] = [];
  #createdUserPasswords: Record<string, string> = {}; // Keys are user name, values are passwords.
  #isCleaningUp = false;
  #cleanupOnError;

  private constructor(client: Client, password?: string, { safe = true, baseName = "test_", cleanupOnError = true }: Options = {}) {
    this.#adminClient = client;
    this.#clientConfig = { ...(this.#adminClient as any).connectionParameters, password };
    this.#safe = safe;
    this.#baseName = baseName;
    this.#cleanupOnError = cleanupOnError;
  }

  /**
   * Create an instance.
   *
   * @param connection is the `pg.client` or connection parameters for `pg.client`.
   * @param options are options.
   */
  static async new(connection: Client | ClientConfig | string, options: Options = {}): Promise<PgTestUtil> {
    try {
      const connectionConfig = getConnectionConfig(connection);
      const adminClient = connection instanceof Client ? connection : new Client({ database: "postgres", ...connectionConfig });
      await adminClient.connect();
      return new this(adminClient, typeof connectionConfig.password === "string" ? connectionConfig.password : undefined, options);
    } catch (error: any) {
      throw new VError(error, "Cannot connect admin client");
    }
  }

  async #getError(cause: Error | string, message?: string): Promise<VError> {
    if (this.#cleanupOnError) await this.cleanup();
    return new VError(cause as any, message);
  }

  /** Generates a unique database name. Simply epoch time is used. */
  #generateName(): string {
    const dbNo = new Date().getTime() - 1518518200000;
    return `${this.#baseName}_${dbNo}`;
  }

  get #lastCreatedDatabaseName(): string {
    return this.#createdDatabaseNames[this.#createdDatabaseNames.length - 1];
  }

  /**
   * Executes given SQL in admin clinet and returns result rows.
   * Admin client can be used fro administration queries such as creating databases etc.
   *
   * @typeparam T is type for single row returned by SQL query.
   *
   * @param sql is sql query.
   * @param params are array of parameters to pass query.
   * @returns result rows of the SQL query.
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      return (await this.#adminClient.query(sql, params)).rows;
    } catch (error: any) {
      throw await this.#getError(error, "Cannot execute admin query");
    }
  }

  /**
   * Returns `Database` instance object for given database name. Also connects to database if it is not connected.
   * If no connection details are provided, default database is returned using same connection parameters as master database.
   *
   * @param name is database name to get instance for. `defaultDatabaseName` is used by default.
   * @returns [[Database]] instance for given database name.
   */
  async getDatabase(name = this.#lastCreatedDatabaseName): Promise<Database> {
    if (!this.#databases[name]) {
      this.#databases[name] = await Database.new({
        clientConfig: { ...this.#clientConfig, database: name },
        cleanup: () => this.cleanup(),
        drop: () => this.dropDatabase(name),
      });
    }
    await this.#databases[name].connect();
    return this.#databases[name];
  }

  /** Disconnects admin client. */
  async disconnect(): Promise<void> {
    try {
      await this.#adminClient.end();
    } catch (error: any) {
      throw await this.#getError(error, "Cannot disconnect admin client");
    }
  }

  /**
   * Disconnects all clients.
   *
   * @param options are options.
   * @param options.admin whether to disconnect admin client.
   */
  async disconnectAll({ admin = true } = {}): Promise<void[]> {
    const promises: Promise<void>[] = Object.values(this.#databases).map((database) => database.disconnect());
    if (admin) promises.push(this.disconnect());
    return Promise.all(promises);
  }

  /** Fetches the list of all databases from server. */
  async fetchAllDatabaseNames(onlyCreated?: boolean): Promise<Array<string>> {
    const databases = (await this.query("SELECT datname FROM pg_database")).map((row) => row.datname);
    return onlyCreated ? databases.filter((database) => this.#createdDatabaseNames.includes(database)) : databases;
  }

  /**
   * Creates a database. If name is not provided generates a name using `baseName` from constructor and part of epoch time.
   *
   * @param options is configuration
   * @param options.name is database name
   * @param options.encoding is database encoding
   * @param options.template is database template to use.
   * @param options.sql is SQL query to execute on database after it is created.
   * @param options.file is SQL query file to execute on database after it is created.
   * @param options.drop is whether to drop database before create command.
   * @param options.safe If true, only databases created by this instance is dropped.
   * @returns [[Database]] object representing created database.
   */
  async createDatabase({
    name = this.#generateName(),
    encoding = "UTF8",
    template = "template0",
    sql,
    file,
    drop,
    safe = this.#safe,
  }: {
    name?: string;
    encoding?: string;
    template?: string;
    sql?: string;
    file?: string;
    drop?: boolean;
    safe?: boolean;
  } = {}): Promise<Database> {
    const createDBSQL = escape("CREATE DATABASE %I WITH ENCODING = %L TEMPLATE = %I;", name, encoding, template);

    if (drop) await this.dropDatabase(name, { safe });
    await this.query(createDBSQL);

    this.#createdDatabaseNames.push(name);

    const database = await this.getDatabase(name);

    if (file) await database.queryFile(file);
    if (sql) await database.query(sql);
    return database;
  }

  /**
   * Copies a given database with a new name.
   *
   * @param options is configuration.
   * @param options.from is source database name or [[Database]] instance to copy from.
   * @param options.to is target database name or [[Database]] instance to copy to.
   * @param options.drop is whether to drop target database before copy.
   * @param options.safe If true, only databases created by this instance is dropped.
   * @returns [[Database]] object.
   */
  async copyDatabase({
    source = this.#lastCreatedDatabaseName,
    target = this.#generateName(),
    drop = false,
    safe = this.#safe,
  }: {
    source?: string | Database;
    target?: string | Database;
    drop?: boolean;
    safe?: boolean;
  }): Promise<Database> {
    const [sourceName, targetName] = [source instanceof Database ? source.name : source, target instanceof Database ? target.name : target];
    if (drop) await this.dropDatabase(targetName, { safe });
    const sourceDatabase = await this.getDatabase(sourceName);
    await sourceDatabase.disconnect();
    await this.query(escape("CREATE DATABASE %I template %I", targetName, sourceName));
    this.#createdDatabaseNames.push(targetName);
    return this.getDatabase(targetName);
  }

  /**
   * Drops given database. To ensure the task, drops all connections to the database beforehand.
   * If `dropOnlyCreated` is true and database is not created by this instance, throws error.
   *
   * @param database is database name or [[Database]] instance to drop.
   * @param options are options
   * @param options.safe If true, only databases created by this instance is dropped.
   */
  async dropDatabase(database: string | Database = this.#lastCreatedDatabaseName, { safe = this.#safe } = {}): Promise<void> {
    const name = database instanceof Database ? database.name : database;
    const createdDatabaseIndex = this.#createdDatabaseNames.indexOf(name);

    if (createdDatabaseIndex === -1 && safe)
      throw await this.#getError(`'${name}' database is not created by this instance. Set "safe" to "false" to force.`);

    if (this.#databases[name]) {
      const databaseObj = database instanceof Database ? database : await this.getDatabase(name);
      await databaseObj.disconnect();
      delete this.#databases[name];
    }

    await this.dropConnections(name);
    await this.query(escape("DROP DATABASE IF EXISTS %I;", name));
    if (createdDatabaseIndex > -1) this.#createdDatabaseNames.splice(createdDatabaseIndex, 1); // Delete from created databases.
  }

  async dropConnections(databaseName: string): Promise<void> {
    await this.query(escape("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=%L;", databaseName));
  }

  /**
   * Drops all databases created by this instance.
   *
   * @param options are options.
   * @param options.disconnect is whether to disconnect admin client.
   */
  async dropAllDatabases({ disconnect = true } = {}): Promise<void> {
    await Promise.all(this.#createdDatabaseNames.map((dbName) => this.dropDatabase(dbName)));
    if (disconnect) await this.disconnect();
  }

  /**
   * Creates a new database user if it does not exist.
   *
   * @param user is the name of the user.
   * @param password is the password for the user.
   */
  async createUser(user: string, password: string): Promise<void> {
    try {
      // DO NOT USE `this.query()`!!! We use special error handling
      await this.#adminClient.query(escape("DO $body$ BEGIN CREATE ROLE %I LOGIN PASSWORD %L; END $body$;", user, password));
      this.#createdUserPasswords[user] = password; // Only add to created users if user does not exist.
    } catch (error: any) {
      // Ignore error if user exists. (Duplicate user error code is 42710). https://www.postgresql.org/docs/current/errcodes-appendix.html
      if (error.code !== "42710") throw await this.#getError(error, `Cannot create user '${user}'`);
    }
  }

  /**
   * Fetches database users from database.
   *
   * @param onlyCreated is whether to fetch users only created by this utility instance.
   * @returns array of usernames.
   */
  async getUserNames(onlyCreated = false): Promise<Array<string>> {
    const result = await this.query('SELECT u.usename AS "name" FROM pg_catalog.pg_user u ORDER BY u.usename');
    const userNames = result.map((row) => row.name);
    return onlyCreated ? userNames.filter((userName) => userName in this.#createdUserPasswords) : userNames;
  }

  /**
   * Drops database user.
   *
   * @param user is user name to drop.
   * @param options are options.
   * @param options.safe If true, only users created by this instance is dropped.
   */
  async dropUser(user: string, { safe = this.#safe } = {}): Promise<void> {
    if (safe && !(user in this.#createdUserPasswords))
      throw await this.#getError(`'${user}' user is not created by this instance. Set "safe" to "false" to force.`);

    await this.query(escape("DROP ROLE IF EXISTS %I", user));
    delete this.#createdUserPasswords[user];
  }

  /** Drops all users created by this instance. */
  async dropAllUsers(): Promise<void> {
    await Promise.all(Object.keys(this.#createdUserPasswords).map((user) => this.dropUser(user)));
    this.#createdUserPasswords = {};
  }

  /**
   * Drops all items created by this instance.
   *
   * @param options are options.
   * @param options.disconnect is whether to disconnect admin client.
   */
  async dropAll({ disconnect = true } = {}): Promise<void> {
    await Promise.all([this.dropAllDatabases({ disconnect }), this.dropAllUsers()]);
  }

  async cleanup(): Promise<void> {
    if (this.#isCleaningUp) return;
    this.#isCleaningUp = true;
    await this.dropAll({ disconnect: true });
    this.#isCleaningUp = false;
  }
}
