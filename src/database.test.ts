import * as path from "path";
import PgTestUtil from "./pg-test-util";
import Database from "./database";
import { getConnectionObject } from "./helper";

const connectionString = "postgresql://user:password@127.0.0.1:5432/template1"; // process.env.PG_TEST_CONNECTION_STRING

const files = {
  build: path.join(__dirname, "test-helper/sql/build-db.sql"),
  data: path.join(__dirname, "test-helper/sql/data.sql"),
  error: path.join(__dirname, "test-helper/sql/error.sql"),
};

let db: { [index: string]: Database };
const connection = getConnectionObject({ connectionString });
const pgTestUtil = new PgTestUtil({ connection });

beforeAll(async () => {
  db = {
    common: await pgTestUtil.createDatabase({ name: "ptudb-query", drop: true, file: files.build }),
    empty: await pgTestUtil.createDatabase({ name: "ptudb-empty", drop: true }),
  };
});

afterAll(async () => {
  await pgTestUtil.dropAll();
});

describe("database", () => {
  it("should survive disconnect even not connected", async () => {
    const tempDb = new Database({
      connection: { ...connection, database: "template1" },
      preError: (): undefined => undefined,
      drop: async (): Promise<undefined> => undefined,
      schemas: ["public"],
    });

    await tempDb.disconnect();
    expect(true).toBe(true);
  });

  it("should drop database", async () => {
    const tempDb = await pgTestUtil.createDatabase({ name: "ptudb-drop", drop: true });
    await tempDb.drop();
    const databases = await pgTestUtil.getDatabaseListFromServer();
    expect(databases.includes("ptudb-drop")).toBe(false);
  });

  it("should query database", async () => {
    const result = await db.common.query("select 1 AS stub");
    expect(result[0].stub).toBe(1);
  });

  it("should truncate tables considering exceptions", async () => {
    await db.common.queryFile(files.data);

    const orgBefore = (await db.common.query("SELECT count(*) AS count FROM organization"))[0].count;
    const memberBefore = (await db.common.query("SELECT count(*) AS count FROM member"))[0].count;
    await db.common.truncate(["member"]);
    const orgAfter = (await db.common.query("SELECT count(*) AS count FROM organization"))[0].count;
    const memberAfter = (await db.common.query("SELECT count(*) AS count FROM member"))[0].count;
    await db.common.truncate(["public.member"]);
    const memberAfter2 = (await db.common.query("SELECT count(*) AS count FROM member"))[0].count;
    await db.common.truncate();

    expect([orgBefore, memberBefore, orgAfter, memberAfter, memberAfter2]).toEqual([2, 2, 0, 2, 2]);
  });

  it("should query database with multiple sql", async () => {
    const result = await db.common.query(["select 1 AS stub", "select 2 AS stub"]);
    expect(result).toEqual([[{ stub: 1 }], [{ stub: 2 }]]);
  });

  it("should throw if no sql is provided", async () => {
    await expect(db.common.query(undefined as any)).rejects.toThrow(/Either 'sql' or 'file'/);
  });

  it("should throw if sql query fails", async () => {
    await expect(db.common.query("XXX")).rejects.toThrow(/Cannot execute given query for/);
  });

  it("should throw if multiple sql query fails", async () => {
    await expect(db.common.query(["XXX", "YYY"])).rejects.toThrow(/Cannot execute given query array/);
  });

  it("should throw if sql file fails", async () => {
    await expect(db.common.queryFile(files.error)).rejects.toThrow(/Cannot execute given query for/);
  });

  it("should throw if sql file cannot be found", async () => {
    await expect(db.common.queryFile("non-existing.sql")).rejects.toThrow(/Cannot execute given SQL file/);
  });

  it("should update sequences", async () => {
    await db.common.query("INSERT INTO organization (id, base_currency) VALUES (1, 'DE1')");
    await db.common.updateSequences();
    await db.common.query("INSERT INTO organization (base_currency) VALUES ('DE2')");
    const result = await db.common.query("SELECT id FROM organization WHERE base_currency = 'DE2'");
    await db.common.truncate();
    expect(result[0].id).toBe(2);
  });

  it("should return empty array for sequences if no sequences are available", async () => {
    const sequences = await db.empty.getSequences();
    expect(sequences).toEqual([]);
  });

  it("should return cached array for sequences", async () => {
    const sequences = await db.empty.getSequences();
    const sequences2 = await db.empty.getSequences();
    expect(sequences).toBe(sequences2);
  });

  it("should return empty array for tables if no sequences are available", async () => {
    const tables = await db.empty.getTables();
    await expect(tables).toEqual([]);
  });

  it("should handle truncate on empty database.", async () => {
    await db.empty.truncate();
    await expect(true).toBe(true);
  });

  it("should refresh cached items", async () => {
    const tablesBefore = (await db.common.getTables()).map((row) => `${row.schema}.${row.table}`);
    await db.common.query('CREATE TABLE "refresh_test_table"("id" Serial NOT NULL);');
    const tablesAgain = (await db.common.getTables()).map((row) => `${row.schema}.${row.table}`);
    db.common.refresh();
    const tablesAfter = (await db.common.getTables()).map((row) => `${row.schema}.${row.table}`);

    expect(tablesBefore.includes("public.refresh_test_table")).toBe(false);
    expect(tablesAgain.includes("public.refresh_test_table")).toBe(false);
    expect(tablesAfter.includes("public.refresh_test_table")).toBe(true);
  });
});
