import * as path from "path";
import PgTestUtil from "./index";
import { getConnectionObject } from "./helper";

const connectionString = "postgresql://user:password@127.0.0.1:5432/template1"; // process.env.PG_TEST_CONNECTION_STRING
const connection = getConnectionObject({ connectionString });

const files = {
  build: path.join(__dirname, "test-helper/sql/build-db.sql"),
  data: path.join(__dirname, "test-helper/sql/data.sql"),
};

describe("pg-test-util", () => {
  describe("instance with disconnectAll", () => {
    let pgTestUtil: PgTestUtil;

    beforeAll(async () => {
      pgTestUtil = new PgTestUtil({ connection, disconnectOnError: true });
    });

    afterAll(async () => {
      await pgTestUtil.dropAll();
    });

    it("should throw if connection info is missing", () => {
      expect(() => new PgTestUtil()).toThrow("Connection configuration does not have all required info.");
    });

    it("should disconnect all on error", async () => {
      await expect(pgTestUtil.createDatabase({ name: "template0" })).rejects.toThrow(/database "template0" already exists/);
    });

    it("should survive disconnect even if not connected", async () => {
      await pgTestUtil.disconnect();
      await pgTestUtil.disconnect();
      expect(pgTestUtil.isConnected).toBe(false);
    });

    it("should disconnect from all databases excluding master", async () => {
      await pgTestUtil.createDatabase({ name: "ptu-disconnect-all", file: files.build });
      await pgTestUtil.disconnectAll({ master: false });
      expect(pgTestUtil.isConnected).toBe(true);
    });

    it("should disconnect from all databases including master", async () => {
      await pgTestUtil.getDatabaseListFromServer();
      await pgTestUtil.disconnectAll();
      expect(pgTestUtil.isConnected).toBe(false);
    });
  });

  describe("instance with defaults", () => {
    let pgTestUtil: PgTestUtil;

    beforeAll(async () => {
      pgTestUtil = new PgTestUtil({ connection });
    });

    afterAll(async () => {
      await pgTestUtil.dropAll();
    });

    it("should use environment variable to connect to server", async () => {
      const db = await pgTestUtil.createDatabase({ name: "pg-test-util", file: files.build });
      expect(db.name).toEqual("pg-test-util");
    });

    it("should get first database as default database", async () => {
      expect(pgTestUtil.defaultDatabaseName).toBe("pg-test-util");
    });

    it("should drop default database", async () => {
      const result = await pgTestUtil.dropDatabase();
      expect(result).toBe(undefined);
    });

    it("should throw error if default database cannot be determined", async () => {
      await pgTestUtil.createDatabase({ name: "pg-test-util3" });
      await pgTestUtil.createDatabase({ name: "pg-test-util4" });
      expect(() => pgTestUtil.defaultDatabaseName).toThrow(/default database should be provided/);
    });

    it("should return list of available databases from server", async () => {
      const databases = await pgTestUtil.getDatabaseListFromServer();
      expect(databases.includes("postgres")).toBe(true);
      expect(databases.includes("non-existing-db-37dsh7")).toBe(false);
    });

    it("should throw error if query causes error", async () => {
      await expect(pgTestUtil.createDatabase({ name: "template0" })).rejects.toThrow(/database "template0" already exists/);
    });

    it("should throw if explicitly disconnected database is queried.", async () => {
      const db = await pgTestUtil.createDatabase({ name: "pg-test-util-explicit-disconnect" });
      await db.disconnect();
      await expect(() => db.query("SELECT 1")).rejects.toThrow("Database is explicitly disconnected");
    });
  });

  describe("instance with wrong master connection", () => {
    let pgTestUtil: PgTestUtil;

    beforeAll(async () => {
      pgTestUtil = new PgTestUtil({
        connection: { database: "wrong-databasse-2y363", user: "user", password: "password" },
      });
    });

    afterAll(async () => {
      await pgTestUtil.disconnect();
    });

    it("should throw trying to connect to master database", async () => {
      await expect(pgTestUtil.createDatabase()).rejects.toThrow(/Cannot connect to master database: wrong-databasse-2y363/);
    });
  });

  describe("instance with custom config", () => {
    let pgTestUtil: PgTestUtil;

    const { user, database, password } = getConnectionObject({ connectionString });

    beforeAll(async () => {
      pgTestUtil = new PgTestUtil({
        baseName: "ptu-custom-base",
        connection: { database, user, password },
        defaultDatabase: "ptu-custom-default",
        dropOnlyCreated: true,
        disconnectOnError: false,
      });
    });

    afterAll(async () => {
      await pgTestUtil.dropAllDatabases();
    });

    it("should not be connected before any operation happens", async () => {
      expect(pgTestUtil.isConnected).toEqual(false);
    });

    it("should create database", async () => {
      const db = await pgTestUtil.createDatabase({ name: "ptu-custom-1", file: files.build });
      const queryResult = await db.query("SELECT 1.2 AS stub");
      expect(queryResult[0]).toEqual({ stub: 1.2 });
    });

    it("should drop database", async () => {
      const db = await pgTestUtil.createDatabase({ name: "ptu-custom-to-drop" });
      await db.query("SELECT 1.2 AS stub");
      const result = await pgTestUtil.dropDatabase(db);
      expect(result).toBe(undefined);
    });

    it("should throw if dropDatabase method fails", async () => {
      await expect(pgTestUtil.dropDatabase("template0", { dropOnlyCreated: false })).rejects.toThrow(/Cannot drop template0/);
    });

    it("should create database with non-default configuration", async () => {
      await pgTestUtil.createDatabase({ name: "ptu-custom-2" });
      const customDb = await pgTestUtil.createDatabase({
        name: "ptu-custom-2",
        file: files.build,
        sql: "INSERT INTO member (name) VALUES ('Lisa')",
        template: "template1",
        encoding: "UTF-8",
        drop: true,
      });
      const queryResult = await customDb.query("SELECT name FROM member WHERE name = 'Lisa'");
      expect(queryResult[0]).toEqual({ name: "Lisa" });
    });

    it("should be connected after operation", async () => {
      expect(pgTestUtil.isConnected).toEqual(true);
    });

    it("should return default database name", async () => {
      expect(pgTestUtil.defaultDatabaseName).toEqual("ptu-custom-default");
    });

    it("should generate name", async () => {
      expect(pgTestUtil.generateName()).toMatch(/^ptu-custom-base-(\d+)$/);
    });

    it("should throw for non-existing database", async () => {
      await expect(pgTestUtil.getDatabase().query("SELECT 1 AS stub")).rejects.toThrow(/database "ptu-custom-default" does not exist/);
    });

    it("should get default database", async () => {
      await pgTestUtil.createDatabase({ name: "ptu-custom-default" });
      const queryResult = await pgTestUtil.getDatabase().query("SELECT 1 AS stub");
      expect(queryResult[0]).toEqual({ stub: 1 });
    });

    it("should create user", async () => {
      await pgTestUtil.createUser("ptu", "1234");
      const users = await pgTestUtil.getUsers();
      const userNames = users.map((u) => u.name);

      expect(userNames.includes("ptu")).toBe(true);
    });

    it("should drop user", async () => {
      await pgTestUtil.dropUser("ptu");
      const users = await pgTestUtil.getUsers();
      const userNames = users.map((u) => u.name);

      expect(userNames.includes("ptu")).toBe(false);
    });

    it("should throw error for dropping user not created by this instance", async () => {
      await expect(pgTestUtil.dropUser("not-existing-2828")).rejects.toThrow(/user is not created by this/);
    });

    it("should throw error for failing to drop user", async () => {
      await expect(pgTestUtil.dropUser(user, { dropOnlyCreated: false })).rejects.toThrow(/Cannot drop user user/);
    });

    it("should copy database with name", async () => {
      await pgTestUtil.createDatabase({ name: "ptu-source", file: files.build });
      const targetDb = await pgTestUtil.copyDatabase({ from: "ptu-source", to: "ptu-target" });
      const queryResult = await targetDb.query("SELECT count(*) AS stub FROM member");
      expect(queryResult[0]).toEqual({ stub: 0 });
    });

    it("should copy database using Database object", async () => {
      const sourceDb = await pgTestUtil.createDatabase({ name: "ptu-source-2", file: files.build });
      const targetDb = await pgTestUtil.createDatabase({ name: "ptu-target-2", file: files.build });
      const newTargetDB = await pgTestUtil.copyDatabase({ from: sourceDb, to: targetDb, drop: true });
      const queryResult = await newTargetDB.query("SELECT count(*) AS stub FROM member");
      expect(queryResult[0]).toEqual({ stub: 0 });
    });

    it("should throw error for failing copy operation", async () => {
      await expect(pgTestUtil.copyDatabase({ to: "template0", drop: true })).rejects.toThrow(/Cannot copy from/);
    });

    it("should drop all items", async () => {
      await pgTestUtil.createDatabase({ name: "ptu-all", file: files.build });
      await pgTestUtil.createUser("ptu-all", "1234");
      await pgTestUtil.dropAll({ disconnect: false });

      const users = await pgTestUtil.getUsers();
      const userNames = users.map((u) => u.name);

      expect(userNames.includes("ptu-all")).toBe(false);
      await expect(pgTestUtil.getDatabase("ptu-all").query("SELECT 1 AS stub")).rejects.toThrow(/database "ptu-all" does not exist/);
    });
  });
});
