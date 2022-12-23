import PgTestUtil from "../src/index";

let pgTestUtil: PgTestUtil;

beforeAll(async () => {
  pgTestUtil = await PgTestUtil.new({ user: "user", password: "password" });
});

afterAll(async () => {
  await pgTestUtil.cleanup();
});

describe("pg-test-util", () => {
  describe("connection", () => {
    it("should connect using PostgreSQL connection string in config object.", async () => {
      const sql = `CREATE TABLE public.member ( id SERIAL NOT NULL, name TEXT NOT NULL, PRIMARY KEY(id))`;
      const localPgTestUtil = await PgTestUtil.new({ connectionString: "postgresql://user:password@localhost/postgres" });
      const database = await localPgTestUtil.createDatabase({ sql });
      expect(await database.query("SELECT * FROM member")).toEqual([]);
      await localPgTestUtil.cleanup();
    });
  });

  describe("createDatabase()", () => {
    it("should create database", async () => {
      const sql = `CREATE TABLE public.member ( id SERIAL NOT NULL, name TEXT NOT NULL, PRIMARY KEY(id))`;
      const database = await pgTestUtil.createDatabase({ sql });
      expect(await database.query("SELECT * FROM member")).toEqual([]);
    });
  });

  describe("fetchAllDatabaseNames()", () => {
    it("should fetch all database names.", async () => {
      const names = await pgTestUtil.fetchAllDatabaseNames();
      expect(names).toContain("postgres");
    });
  });
});
