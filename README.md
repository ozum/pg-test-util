# pg-test-util

Utility library for administrative database operations.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Synopsis](#synopsis)
  - [Single Database](#single-database)
  - [Multiple Databases](#multiple-databases)
  - [Unit Tests (Jest, Mocha, Lab etc.)](#unit-tests-jest-mocha-lab-etc)
- [Details](#details)
- [API](#api)
- [pg-test-util](#pg-test-util)
  - [Type aliases](#type-aliases)
    - [ConnectionConfig](#connectionconfig)
    - [SequenceInfo](#sequenceinfo)
    - [TableInfo](#tableinfo)
  - [Functions](#functions)
    - [isConnectionConfigWithObject](#isconnectionconfigwithobject)
- [Classes](#classes)
- [Class: Database](#class-database)
  - [Hierarchy](#hierarchy)
  - [Properties](#properties)
    - [drop](#drop)
  - [Accessors](#accessors)
    - [isConnected](#isconnected)
    - [knex](#knex)
    - [name](#name)
  - [Methods](#methods)
    - [disconnect](#disconnect)
    - [getSequences](#getsequences)
    - [getTables](#gettables)
    - [query](#query)
    - [queryFile](#queryfile)
    - [refresh](#refresh)
    - [truncate](#truncate)
    - [updateSequences](#updatesequences)
- [Class: PgTestUtil](#class-pgtestutil)
  - [Hierarchy](#hierarchy-1)
  - [Constructors](#constructors)
    - [constructor](#constructor)
  - [Accessors](#accessors-1)
    - [defaultDatabaseName](#defaultdatabasename)
    - [isConnected](#isconnected-1)
  - [Methods](#methods-1)
    - [copyDatabase](#copydatabase)
    - [createDatabase](#createdatabase)
    - [createUser](#createuser)
    - [disconnect](#disconnect-1)
    - [disconnectAll](#disconnectall)
    - [dropAll](#dropall)
    - [dropAllDatabases](#dropalldatabases)
    - [dropAllUsers](#dropallusers)
    - [dropDatabase](#dropdatabase)
    - [dropUser](#dropuser)
    - [generateName](#generatename)
    - [getDatabase](#getdatabase)
    - [getDatabaseListFromServer](#getdatabaselistfromserver)
    - [getUsers](#getusers)
- [Interfaces](#interfaces)
- [Interface: ConnectionConfigWithObject](#interface-connectionconfigwithobject)
  - [Hierarchy](#hierarchy-2)
  - [Properties](#properties-1)
    - [`Optional` connectionString](#optional-connectionstring)
    - [database](#database)
    - [`Optional` host](#optional-host)
    - [password](#password)
    - [`Optional` port](#optional-port)
    - [user](#user)
- [Interface: ConnectionConfigWithString](#interface-connectionconfigwithstring)
  - [Hierarchy](#hierarchy-3)
  - [Properties](#properties-2)
    - [connectionString](#connectionstring)
    - [`Optional` database](#optional-database)
    - [`Optional` host](#optional-host-1)
    - [`Optional` password](#optional-password)
    - [`Optional` port](#optional-port-1)
    - [`Optional` user](#optional-user)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Synopsis

```ts
import PgTestUtil from "pg-test-util";

const pgTestUtil = new PgTestUtil({ database: "db", user: "user", password: "password" });
const db = pgTestUtil.createDatabase("my_database");
```

## Single Database

```ts
import PgTestUtil from "pg-test-util";

const pgTestUtil = new PgTestUtil(); // Uses connection string from: process.env.PG_TEST_CONNECTION_STRING

db = pgTestUtil.createDatabase(); // No name given, so creates test-db-26352723 (number will be different)
db.knex("books").insert({ title: "Master Node JS" }); // Get knex of database.
db.truncate(["preData"]); // Truncates all tables except preData
pgTestUtil.dropDatabase(); // Drops created db.
```

## Multiple Databases

```ts
import PgTestUtil from "pg-test-util";

const pgTestUtil = new PgTestUtil({
  baseName: "my-project", // Base name for auto generated names.
  defaultDatabase: "main-db", // Database to use if no db name provided.
  connection: {
    connectionString: "postgresql://user:password@127.0.0.1:5432/template1",
  },
});

db1 = pgTestUtil.createDatabase(); // No name given, so creates my-project-63526273 (number will be different)
db2 = pgTestUtil.createDatabase({ name: "main-db" }); // Creates main-db, which is also defined as default database in constructor.
db3 = pgTestUtil.createDatabase({ name: "some-db" }); // Creates some-db
db2.truncate(["preData"]); // Truncates all tables in main-db except preData
db1.drop(); // Drops my-project-63526273 database. (Database#drop())
pgTestUtil.dropDatabase(); // Drops default db (main-db). (PgTestUtil#dropDatabase())
pgTestUtil.dropDatabase("some-db"); // Drops default db (some-db). (PgTestUtil#dropDatabase())
```

## Unit Tests (Jest, Mocha, Lab etc.)

```ts
import PgTestUtil from "pg-test-util";

const pgTestUtil = new PgTestUtil();
let knex;
let database;

beforeAll(async () => {
  database = await pgTestUtil.createDatabase({
    drop: true,
    name: "my-test-db",
    file: `${__dirname}/__test-supplements__/create-db.sql`,
  });

  ({ knex } = database);
});

afterAll(async () => {
  await pgTestUtil.dropAllDatabases(); // To inspect without drop use: await pgTestUtil.disconnectAll({ disconnect: true });
});

describe("csv", () => {
  beforeEach(async () => {
    await database.truncate();
  });

  it("should have expected records.", async () => {
    const { count } = (await knex("MyYable").count("*"))[0];
    expect(count).toEqual(5);
  });
});
```

# Details

Utility library for creating, dropping, truncating and similar operations related to PostgreSQL.
It uses `knex` for individual databases, and `pg` driver for master connection and administrative purposes.

It is ideal to use in unit tests. Also has typescript support.

# API

<a name="readmemd"></a>

[pg-test-util](#readmemd)

# pg-test-util

## Type aliases

### ConnectionConfig

Ƭ **ConnectionConfig**: _object_

_Defined in [types/index.ts:2](https://github.com/ozum/pg-test-util/blob/fce7d11/src/types/index.ts#L2)_

Connection information.

#### Type declaration:

- **connectionString**: _string_

- **database**: _string_

- **host**: _string_

- **password**: _string_

- **port**: _number_

- **user**: _string_

---

### SequenceInfo

Ƭ **SequenceInfo**: _object_

_Defined in [types/index.ts:45](https://github.com/ozum/pg-test-util/blob/fce7d11/src/types/index.ts#L45)_

#### Type declaration:

- **column**: _string_

- **schema**: _string_

- **sequence**: _string_

- **table**: _string_

---

### TableInfo

Ƭ **TableInfo**: _object_

_Defined in [types/index.ts:38](https://github.com/ozum/pg-test-util/blob/fce7d11/src/types/index.ts#L38)_

Type to store table details.

#### Type declaration:

- **schema**: _string_

- **table**: _string_

## Functions

### isConnectionConfigWithObject

▸ **isConnectionConfigWithObject**(`config`: any): _config is ConnectionConfigWithObject_

_Defined in [helper.ts:5](https://github.com/ozum/pg-test-util/blob/fce7d11/src/helper.ts#L5)_

**Parameters:**

| Name     | Type |
| -------- | ---- |
| `config` | any  |

**Returns:** _config is ConnectionConfigWithObject_

# Classes

<a name="classesdatabasemd"></a>

[pg-test-util](#readmemd) › [Database](#classesdatabasemd)

# Class: Database

Database class is used for tasks related to individual database such as connecting, querying, getting tables, getting sequences etc.

## Hierarchy

- **Database**

## Properties

### drop

• **drop**: _function_

_Defined in [database.ts:50](https://github.com/ozum/pg-test-util/blob/fce7d11/src/database.ts#L50)_

Function to drop this database. `DROP DATABSE` sql query must be executed from another database, so this function should be passed to constructor.

#### Type declaration:

▸ (): _Promise‹void›_

## Accessors

### isConnected

• **get isConnected**(): _boolean_

_Defined in [database.ts:58](https://github.com/ozum/pg-test-util/blob/fce7d11/src/database.ts#L58)_

Whether database is connected or not.

**Returns:** _boolean_

---

### knex

• **get knex**(): _[knex](#knex)_

_Defined in [database.ts:63](https://github.com/ozum/pg-test-util/blob/fce7d11/src/database.ts#L63)_

`knex` object for database. It may be used to build queries easily.

**Returns:** _[knex](#knex)_

---

### name

• **get name**(): _string_

_Defined in [database.ts:53](https://github.com/ozum/pg-test-util/blob/fce7d11/src/database.ts#L53)_

Database name.

**Returns:** _string_

## Methods

### disconnect

▸ **disconnect**(): _Promise‹void›_

_Defined in [database.ts:72](https://github.com/ozum/pg-test-util/blob/fce7d11/src/database.ts#L72)_

Disconnects from database.

**Returns:** _Promise‹void›_

---

### getSequences

▸ **getSequences**(): _Promise‹[SequenceInfo](#sequenceinfo)[]›_

_Defined in [database.ts:121](https://github.com/ozum/pg-test-util/blob/fce7d11/src/database.ts#L121)_

Returns sequences from database. Uses cache for fast results. Use `refresh()` method to refresh the cache.

**Returns:** _Promise‹[SequenceInfo](#sequenceinfo)[]›_

information about sequences

---

### getTables

▸ **getTables**(): _Promise‹[TableInfo](#tableinfo)[]›_

_Defined in [database.ts:98](https://github.com/ozum/pg-test-util/blob/fce7d11/src/database.ts#L98)_

Returns tables from database. Uses cache for fast results. Use `refresh()` method to refresh the cache.

**Returns:** _Promise‹[TableInfo](#tableinfo)[]›_

information about tables.

---

### query

▸ **query**<**T**>(`sql`: string | Array‹string›): _Promise‹T[]›_

_Defined in [database.ts:221](https://github.com/ozum/pg-test-util/blob/fce7d11/src/database.ts#L221)_

Executes given SQL and returns results.

**Type parameters:**

▪ **T**: _any_

is type for single row returned by SQL query.

**Parameters:**

| Name  | Type                        | Description                                      |
| ----- | --------------------------- | ------------------------------------------------ |
| `sql` | string &#124; Array‹string› | is sql query or array of sql queries to execute. |

**Returns:** _Promise‹T[]›_

result rows of the SQL query. If multiple queries are given results are concatenated into single array.

---

### queryFile

▸ **queryFile**<**T**>(`file`: string): _Promise‹T[]›_

_Defined in [database.ts:204](https://github.com/ozum/pg-test-util/blob/fce7d11/src/database.ts#L204)_

Reads and executes SQL in given file and returns results.

**Type parameters:**

▪ **T**: _any_

is type for single row returned by SQL query.

**Parameters:**

| Name   | Type   | Description               |
| ------ | ------ | ------------------------- |
| `file` | string | is file to read SQL from. |

**Returns:** _Promise‹T[]›_

result rows of the SQL query.

---

### refresh

▸ **refresh**(): _void_

_Defined in [database.ts:88](https://github.com/ozum/pg-test-util/blob/fce7d11/src/database.ts#L88)_

Clears tables and sequences cache.

**Returns:** _void_

---

### truncate

▸ **truncate**(`ignoreTables`: Array‹string›): _Promise‹void›_

_Defined in [database.ts:177](https://github.com/ozum/pg-test-util/blob/fce7d11/src/database.ts#L177)_

Truncates all tables in database.

**Parameters:**

| Name           | Type          | Default | Description                   |
| -------------- | ------------- | ------- | ----------------------------- |
| `ignoreTables` | Array‹string› | []      | are list of tables to ignore. |

**Returns:** _Promise‹void›_

---

### updateSequences

▸ **updateSequences**(): _Promise‹void›_

_Defined in [database.ts:149](https://github.com/ozum/pg-test-util/blob/fce7d11/src/database.ts#L149)_

Set current value of sequence for each column of all tables based on record with maximum number. If there are no record in the table, the value will be set to 1.

**Returns:** _Promise‹void›_

<a name="classespgtestutilmd"></a>

[pg-test-util](#readmemd) › [PgTestUtil](#classespgtestutilmd)

# Class: PgTestUtil

PgTestUtil class is used to perform PostgreSQL operations related to unit testing such as create database, truncate database and
drop database etc.

## Hierarchy

- **PgTestUtil**

## Constructors

### constructor

\+ **new PgTestUtil**(`__namedParameters`: object): _[PgTestUtil](#classespgtestutilmd)_

_Defined in [pg-test-util.ts:30](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L30)_

Creates an instance of PgTestUtil.

**Parameters:**

▪`Default value` **\_\_namedParameters**: _object_= {} as PgTestUtilConstructorArgs

| Name                | Type                                                                                                                                               | Default   | Description                                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `baseName`          | string                                                                                                                                             | "test-db" | is base name to use if database name is provided during database creation.                                                                                                     |
| `connection`        | [ConnectionConfigWithObject](#interfacesconnectionconfigwithobjectmd) &#124; [ConnectionConfigWithString](#interfacesconnectionconfigwithstringmd) | -         | is connection parameters for connecting master database. If not provided, `process.env.PG_TEST_CONNECTION_STRING` is used.                                                     |
| `defaultDatabase`   | undefined &#124; string                                                                                                                            | -         | is fefault database name to use in queries. If not provided, first created database is used.                                                                                   |
| `disconnectOnError` | boolean                                                                                                                                            | false     | is whether to disconnects from all databases on error caused by this instance. (Should not be used in unit tests. Disconnect or drop in `afterAll` method of testing library.) |
| `dropOnlyCreated`   | boolean                                                                                                                                            | true      | if true, `drop` method does not drop databases which are not created by this object instance.                                                                                  |

**Returns:** _[PgTestUtil](#classespgtestutilmd)_

## Accessors

### defaultDatabaseName

• **get defaultDatabaseName**(): _string_

_Defined in [pg-test-util.ts:140](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L140)_

Default database name which is determined by algorithm below:

1. `defaultDatabase` name provided during instance creation.
2. If only one database is created, created database.
3. Cannot be determined a default database name.

**`throws`** Throws error if no default database name can be determinded.

**Returns:** _string_

---

### isConnected

• **get isConnected**(): _boolean_

_Defined in [pg-test-util.ts:128](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L128)_

Connection status.

**Returns:** _boolean_

## Methods

### copyDatabase

▸ **copyDatabase**(`__namedParameters`: object): _Promise‹[Database](#classesdatabasemd)›_

_Defined in [pg-test-util.ts:334](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L334)_

Copies a given database with a new name.

**Parameters:**

▪ **\_\_namedParameters**: _object_

| Name   | Type                                           | Default                  |
| ------ | ---------------------------------------------- | ------------------------ |
| `drop` | boolean                                        | false                    |
| `from` | string &#124; [Database](#classesdatabasemd)‹› | this.defaultDatabaseName |
| `to`   | string &#124; [Database](#classesdatabasemd)‹› | -                        |

**Returns:** _Promise‹[Database](#classesdatabasemd)›_

[Database](#classesdatabasemd) object.

---

### createDatabase

▸ **createDatabase**(`__namedParameters`: object): _Promise‹[Database](#classesdatabasemd)›_

_Defined in [pg-test-util.ts:289](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L289)_

Creates a database. If name is not provided generates a name using `baseName` from constructor and part of epoch time.

**Parameters:**

▪`Default value` **\_\_namedParameters**: _object_= {}

| Name       | Type                    | Default             |
| ---------- | ----------------------- | ------------------- |
| `drop`     | boolean                 | false               |
| `encoding` | string                  | "UTF8"              |
| `file`     | undefined &#124; string | -                   |
| `name`     | string                  | this.generateName() |
| `sql`      | undefined &#124; string | -                   |
| `template` | string                  | "template0"         |

**Returns:** _Promise‹[Database](#classesdatabasemd)›_

[Database](#classesdatabasemd) object representing created database.

---

### createUser

▸ **createUser**(`user`: string, `password`: string): _Promise‹QueryResult›_

_Defined in [pg-test-util.ts:224](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L224)_

Creates a new database user.

**Parameters:**

| Name       | Type   | Description                   |
| ---------- | ------ | ----------------------------- |
| `user`     | string | is user name to create        |
| `password` | string | is password for created user. |

**Returns:** _Promise‹QueryResult›_

query result.

---

### disconnect

▸ **disconnect**(): _Promise‹void›_

_Defined in [pg-test-util.ts:187](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L187)_

Disconnects from master database.

**Returns:** _Promise‹void›_

---

### disconnectAll

▸ **disconnectAll**(`__namedParameters`: object): _Promise‹void[]›_

_Defined in [pg-test-util.ts:207](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L207)_

Disconnects from all databases.

**Parameters:**

▪`Default value` **\_\_namedParameters**: _object_= {}

| Name     | Type    | Default |
| -------- | ------- | ------- |
| `master` | boolean | true    |

**Returns:** _Promise‹void[]›_

---

### dropAll

▸ **dropAll**(`__namedParameters`: object): _Promise‹void›_

_Defined in [pg-test-util.ts:419](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L419)_

Drops all items created by this instance.

**Parameters:**

▪`Default value` **\_\_namedParameters**: _object_= {}

| Name         | Type    | Default | Description                                    |
| ------------ | ------- | ------- | ---------------------------------------------- |
| `disconnect` | boolean | true    | is whether to disconnect from master database. |

**Returns:** _Promise‹void›_

---

### dropAllDatabases

▸ **dropAllDatabases**(`__namedParameters`: object): _Promise‹void›_

_Defined in [pg-test-util.ts:405](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L405)_

Drops all databases created by this instance.

**Parameters:**

▪`Default value` **\_\_namedParameters**: _object_= {}

| Name         | Type    | Default |
| ------------ | ------- | ------- |
| `disconnect` | boolean | true    |

**Returns:** _Promise‹void›_

---

### dropAllUsers

▸ **dropAllUsers**(): _Promise‹void›_

_Defined in [pg-test-util.ts:273](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L273)_

Drops all users created by this instance.

**Returns:** _Promise‹void›_

---

### dropDatabase

▸ **dropDatabase**(`database`: string | [Database](#classesdatabasemd), `__namedParameters`: object): _Promise‹void›_

_Defined in [pg-test-util.ts:366](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L366)_

Drops given database. To ensure the task, drops all connections to the database beforehand.
If `dropOnlyCreated` is true and database is not created by this instance, throws error.

**Parameters:**

▪`Default value` **database**: _string | [Database](#classesdatabasemd)_= this.defaultDatabaseName

is database name or `Database` instance to drop.

▪`Default value` **\_\_namedParameters**: _object_= {}

| Name              | Type    | Default              |
| ----------------- | ------- | -------------------- |
| `dropOnlyCreated` | boolean | this.dropOnlyCreated |

**Returns:** _Promise‹void›_

---

### dropUser

▸ **dropUser**(`user`: string, `__namedParameters`: object): _Promise‹void›_

_Defined in [pg-test-util.ts:253](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L253)_

Drops database user.

**Parameters:**

▪ **user**: _string_

is user name to drop.

▪`Default value` **\_\_namedParameters**: _object_= {}

| Name              | Type    | Default              |
| ----------------- | ------- | -------------------- |
| `dropOnlyCreated` | boolean | this.dropOnlyCreated |

**Returns:** _Promise‹void›_

---

### generateName

▸ **generateName**(): _string_

_Defined in [pg-test-util.ts:158](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L158)_

Generates a unique database name. Uniqueness of database name is not generated useing an advanced
algorithm or technique. Simply epoch time is used.

**Returns:** _string_

unique database name

---

### getDatabase

▸ **getDatabase**(`name`: string): _[Database](#classesdatabasemd)_

_Defined in [pg-test-util.ts:170](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L170)_

Returns `Database` instance object for given database name. Also connects to database if it is not connected.
If no connection details are provided, default database is returned using same connection parameters as master database.

**Parameters:**

| Name   | Type   | Default                  | Description                                                                     |
| ------ | ------ | ------------------------ | ------------------------------------------------------------------------------- |
| `name` | string | this.defaultDatabaseName | is database name to get instance for. `defaultDatabaseName` is used by default. |

**Returns:** _[Database](#classesdatabasemd)_

[Database](#classesdatabasemd) instance for given database name.

---

### getDatabaseListFromServer

▸ **getDatabaseListFromServer**(): _Promise‹Array‹string››_

_Defined in [pg-test-util.ts:115](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L115)_

Fetches and returns list of databases from server.

**Returns:** _Promise‹Array‹string››_

list of databases.

---

### getUsers

▸ **getUsers**(): _Promise‹Array‹object››_

_Defined in [pg-test-util.ts:241](https://github.com/ozum/pg-test-util/blob/fce7d11/src/pg-test-util.ts#L241)_

Returns database users.

**Returns:** _Promise‹Array‹object››_

database users as [{ name: 'user1' }, ...]

# Interfaces

<a name="interfacesconnectionconfigwithobjectmd"></a>

[pg-test-util](#readmemd) › [ConnectionConfigWithObject](#interfacesconnectionconfigwithobjectmd)

# Interface: ConnectionConfigWithObject

Connection information which includes connection details, but not connection string.

## Hierarchy

- **ConnectionConfigWithObject**

## Properties

### `Optional` connectionString

• **connectionString**? : _undefined_

_Defined in [types/index.ts:29](https://github.com/ozum/pg-test-util/blob/fce7d11/src/types/index.ts#L29)_

---

### database

• **database**: _string_

_Defined in [types/index.ts:30](https://github.com/ozum/pg-test-util/blob/fce7d11/src/types/index.ts#L30)_

---

### `Optional` host

• **host**? : _undefined | string_

_Defined in [types/index.ts:33](https://github.com/ozum/pg-test-util/blob/fce7d11/src/types/index.ts#L33)_

---

### password

• **password**: _string_

_Defined in [types/index.ts:32](https://github.com/ozum/pg-test-util/blob/fce7d11/src/types/index.ts#L32)_

---

### `Optional` port

• **port**? : _undefined | number_

_Defined in [types/index.ts:34](https://github.com/ozum/pg-test-util/blob/fce7d11/src/types/index.ts#L34)_

---

### user

• **user**: _string_

_Defined in [types/index.ts:31](https://github.com/ozum/pg-test-util/blob/fce7d11/src/types/index.ts#L31)_

<a name="interfacesconnectionconfigwithstringmd"></a>

[pg-test-util](#readmemd) › [ConnectionConfigWithString](#interfacesconnectionconfigwithstringmd)

# Interface: ConnectionConfigWithString

Connection information which includes connection string and optional configuration details.

## Hierarchy

- **ConnectionConfigWithString**

## Properties

### connectionString

• **connectionString**: _string_

_Defined in [types/index.ts:19](https://github.com/ozum/pg-test-util/blob/fce7d11/src/types/index.ts#L19)_

---

### `Optional` database

• **database**? : _undefined | string_

_Defined in [types/index.ts:20](https://github.com/ozum/pg-test-util/blob/fce7d11/src/types/index.ts#L20)_

---

### `Optional` host

• **host**? : _undefined | string_

_Defined in [types/index.ts:23](https://github.com/ozum/pg-test-util/blob/fce7d11/src/types/index.ts#L23)_

---

### `Optional` password

• **password**? : _undefined | string_

_Defined in [types/index.ts:22](https://github.com/ozum/pg-test-util/blob/fce7d11/src/types/index.ts#L22)_

---

### `Optional` port

• **port**? : _undefined | number_

_Defined in [types/index.ts:24](https://github.com/ozum/pg-test-util/blob/fce7d11/src/types/index.ts#L24)_

---

### `Optional` user

• **user**? : _undefined | string_

_Defined in [types/index.ts:21](https://github.com/ozum/pg-test-util/blob/fce7d11/src/types/index.ts#L21)_
