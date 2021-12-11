import PgTestUtil from "../src/index";

let pgTestUtil: PgTestUtil;

beforeAll(async () => {
  pgTestUtil = await PgTestUtil.new({ user: "user", password: "password" });
});

afterAll(async () => {
  await pgTestUtil.cleanup();
});

describe("pg-test-util", () => {
  it("should create database", async () => {
    const sql = `CREATE TABLE public.member ( id SERIAL NOT NULL, name TEXT NOT NULL, PRIMARY KEY(id))`;
    const database = await pgTestUtil.createDatabase({ sql });
    expect(await database.query("SELECT * FROM member")).toEqual([]);
  });
});
