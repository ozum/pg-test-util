import { getConnectionObject } from "./helper";

describe("helper", () => {
  it("should have some default values", async () => {
    const connectionObject = getConnectionObject();
    expect(connectionObject).toEqual({
      connectionString: "postgresql://undefined:undefined@127.0.0.1:5432/template1",
      database: "template1",
      host: "127.0.0.1",
      password: undefined,
      port: 5432,
      user: undefined
    });
  });
});
