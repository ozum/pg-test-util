# pg-test-util

PostgreSQL administrative utilities such as creating and dropping tables, users etc.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Synopsis](#synopsis)
- [Details](#details)
- [API](#api)
  - [Table of contents](#table-of-contents)
    - [Classes](#classes)
    - [Interfaces](#interfaces)
    - [Type aliases](#type-aliases)
  - [Type aliases](#type-aliases-1)
    - [EntityInfo](#entityinfo)
    - [SequenceInfo](#sequenceinfo)
- [Classes](#classes-1)
- [Class: Database](#class-database)
  - [Table of contents](#table-of-contents-1)
    - [Properties](#properties)
    - [Accessors](#accessors)
    - [Methods](#methods)
  - [Properties](#properties-1)
    - [client](#client)
    - [drop](#drop)
  - [Accessors](#accessors-1)
    - [name](#name)
  - [Methods](#methods-1)
    - [connect](#connect)
    - [disconnect](#disconnect)
    - [getMaterializedViews](#getmaterializedviews)
    - [getPartitionedTables](#getpartitionedtables)
    - [getSequences](#getsequences)
    - [getTables](#gettables)
    - [getViews](#getviews)
    - [query](#query)
    - [queryFile](#queryfile)
    - [refresh](#refresh)
    - [syncSequences](#syncsequences)
    - [truncate](#truncate)
- [Class: default](#class-default)
  - [Table of contents](#table-of-contents-2)
    - [Methods](#methods-2)
  - [Methods](#methods-3)
    - [cleanup](#cleanup)
    - [copyDatabase](#copydatabase)
    - [createDatabase](#createdatabase)
    - [createUser](#createuser)
    - [disconnect](#disconnect-1)
    - [disconnectAll](#disconnectall)
    - [dropAll](#dropall)
    - [dropAllDatabases](#dropalldatabases)
    - [dropAllUsers](#dropallusers)
    - [dropConnections](#dropconnections)
    - [dropDatabase](#dropdatabase)
    - [dropUser](#dropuser)
    - [fetcAllDatabaseNames](#fetcalldatabasenames)
    - [getDatabase](#getdatabase)
    - [getUserNames](#getusernames)
    - [query](#query-1)
    - [new](#new)
- [Interfaces](#interfaces-1)
- [Interface: Options](#interface-options)
  - [Table of contents](#table-of-contents-3)
    - [Properties](#properties-2)
  - [Properties](#properties-3)
    - [baseName](#basename)
    - [cleanupOnError](#cleanuponerror)
    - [safe](#safe)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Synopsis

```ts
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
```

# Details

<!-- usage -->

<!-- commands -->

<%_ if (typedoc) { _%>

# API

<a name="readmemd"></a>

## Table of contents

### Classes

- [Database](#classesdatabasemd)
- [default](#classesdefaultmd)

### Interfaces

- [Options](#interfacesoptionsmd)

### Type aliases

- [EntityInfo](#entityinfo)
- [SequenceInfo](#sequenceinfo)

## Type aliases

### EntityInfo

Ƭ **EntityInfo**: `Object`

Type to store entity details.

#### Type declaration

| Name     | Type     | Description                |
| :------- | :------- | :------------------------- |
| `name`   | `string` | Entity name                |
| `schema` | `string` | Schema name of the entity. |

#### Defined in

[types.ts:2](https://github.com/ozum/pg-test-util/blob/569dcb4/src/types.ts#L2)

---

### SequenceInfo

Ƭ **SequenceInfo**: `Object`

#### Type declaration

| Name     | Type     | Description                                   |
| :------- | :------- | :-------------------------------------------- |
| `column` | `string` | Column name which sequence is related to.     |
| `name`   | `string` | Name of the sequence                          |
| `schema` | `string` | Schema name of the table sequence is defined. |
| `table`  | `string` | Table name of the sequence.                   |

#### Defined in

[types.ts:9](https://github.com/ozum/pg-test-util/blob/569dcb4/src/types.ts#L9)

# Classes

<a name="classesdatabasemd"></a>

[pg-test-util](#readmemd) / Database

# Class: Database

Execute tasks related to individual database such as connecting, querying, getting tables, getting sequences etc.

## Table of contents

### Properties

- [client](#client)
- [drop](#drop)

### Accessors

- [name](#name)

### Methods

- [connect](#connect)
- [disconnect](#disconnect)
- [getMaterializedViews](#getmaterializedviews)
- [getPartitionedTables](#getpartitionedtables)
- [getSequences](#getsequences)
- [getTables](#gettables)
- [getViews](#getviews)
- [query](#query)
- [queryFile](#queryfile)
- [refresh](#refresh)
- [syncSequences](#syncsequences)
- [truncate](#truncate)

## Properties

### client

• `Readonly` **client**: `Client`

[node-postgres client](https://node-postgres.com/api/client)

#### Defined in

[database.ts:35](https://github.com/ozum/pg-test-util/blob/569dcb4/src/database.ts#L35)

---

### drop

• `Readonly` **drop**: () => `Promise`<`void`\>

#### Type declaration

▸ (): `Promise`<`void`\>

Drops the database.

##### Returns

`Promise`<`void`\>

#### Defined in

[database.ts:38](https://github.com/ozum/pg-test-util/blob/569dcb4/src/database.ts#L38)

## Accessors

### name

• `get` **name**(): `string`

Name of the database

#### Returns

`string`

#### Defined in

[database.ts:62](https://github.com/ozum/pg-test-util/blob/569dcb4/src/database.ts#L62)

## Methods

### connect

▸ **connect**(): `Promise`<`void`\>

Connects to database.

#### Returns

`Promise`<`void`\>

#### Defined in

[database.ts:67](https://github.com/ozum/pg-test-util/blob/569dcb4/src/database.ts#L67)

---

### disconnect

▸ **disconnect**(): `Promise`<`void`\>

Disconnects from database.

#### Returns

`Promise`<`void`\>

#### Defined in

[database.ts:78](https://github.com/ozum/pg-test-util/blob/569dcb4/src/database.ts#L78)

---

### getMaterializedViews

▸ **getMaterializedViews**(): `Promise`<[`EntityInfo`](#entityinfo)[]\>

Returns materialized views from database. Uses cache for fast results. Use `refresh()` method to refresh the cache.

#### Returns

`Promise`<[`EntityInfo`](#entityinfo)[]\>

#### Defined in

[database.ts:136](https://github.com/ozum/pg-test-util/blob/569dcb4/src/database.ts#L136)

---

### getPartitionedTables

▸ **getPartitionedTables**(): `Promise`<[`EntityInfo`](#entityinfo)[]\>

Returns partitioned tables from database. Uses cache for fast results. Use `refresh()` method to refresh the cache.

#### Returns

`Promise`<[`EntityInfo`](#entityinfo)[]\>

#### Defined in

[database.ts:142](https://github.com/ozum/pg-test-util/blob/569dcb4/src/database.ts#L142)

---

### getSequences

▸ **getSequences**(): `Promise`<[`SequenceInfo`](#sequenceinfo)[]\>

Returns sequences from database. Uses cache for fast results. Use `refresh()` method to refresh the cache.

#### Returns

`Promise`<[`SequenceInfo`](#sequenceinfo)[]\>

#### Defined in

[database.ts:148](https://github.com/ozum/pg-test-util/blob/569dcb4/src/database.ts#L148)

---

### getTables

▸ **getTables**(): `Promise`<[`EntityInfo`](#entityinfo)[]\>

Returns tables from database. Uses cache for fast results. Use `refresh()` method to refresh the cache.

#### Returns

`Promise`<[`EntityInfo`](#entityinfo)[]\>

#### Defined in

[database.ts:124](https://github.com/ozum/pg-test-util/blob/569dcb4/src/database.ts#L124)

---

### getViews

▸ **getViews**(): `Promise`<[`EntityInfo`](#entityinfo)[]\>

Returns views from database. Uses cache for fast results. Use `refresh()` method to refresh the cache.

#### Returns

`Promise`<[`EntityInfo`](#entityinfo)[]\>

#### Defined in

[database.ts:130](https://github.com/ozum/pg-test-util/blob/569dcb4/src/database.ts#L130)

---

### query

▸ **query**<`T`\>(`sql`, `params?`): `Promise`<`T`[]\>

Executes given SQL and returns result rows.

#### Type parameters

| Name | Type  | Description                                   |
| :--- | :---- | :-------------------------------------------- |
| `T`  | `any` | is type for single row returned by SQL query. |

#### Parameters

| Name      | Type     | Description                            |
| :-------- | :------- | :------------------------------------- |
| `sql`     | `string` | is sql query.                          |
| `params?` | `any`[]  | are array of parameters to pass query. |

#### Returns

`Promise`<`T`[]\>

result rows of the SQL query.

#### Defined in

[database.ts:207](https://github.com/ozum/pg-test-util/blob/569dcb4/src/database.ts#L207)

---

### queryFile

▸ **queryFile**<`T`\>(`file`, `params?`): `Promise`<`T`[]\>

Reads and executes SQL in given file and returns results.

#### Type parameters

| Name | Type  | Description                                   |
| :--- | :---- | :-------------------------------------------- |
| `T`  | `any` | is type for single row returned by SQL query. |

#### Parameters

| Name      | Type     | Description                            |
| :-------- | :------- | :------------------------------------- |
| `file`    | `string` | is file to read SQL from.              |
| `params?` | `any`[]  | are array of parameters to pass query. |

#### Returns

`Promise`<`T`[]\>

result rows of the SQL query.

#### Defined in

[database.ts:226](https://github.com/ozum/pg-test-util/blob/569dcb4/src/database.ts#L226)

---

### refresh

▸ **refresh**(): `Promise`<`void`\>

Fetches database objects (i.e. tables, sequences) from database and refreshes the cache of the object. If you create new tables etc., you should refresh.

#### Returns

`Promise`<`void`\>

#### Defined in

[database.ts:89](https://github.com/ozum/pg-test-util/blob/569dcb4/src/database.ts#L89)

---

### syncSequences

▸ **syncSequences**(): `Promise`<`void`\>

Set current value of sequence for each column of all tables based on record with maximum number. If there are no record in the table, the value will be set to 1.

#### Returns

`Promise`<`void`\>

#### Defined in

[database.ts:154](https://github.com/ozum/pg-test-util/blob/569dcb4/src/database.ts#L154)

---

### truncate

▸ **truncate**(`ignore?`): `Promise`<`void`\>

Truncates all tables and resets their sequences in the database.

#### Parameters

| Name             | Type       | Description                           |
| :--------------- | :--------- | :------------------------------------ |
| `ignore`         | `Object`   | are the list of the tables to ignore. |
| `ignore.ignore?` | `string`[] | -                                     |

#### Returns

`Promise`<`void`\>

#### Defined in

[database.ts:180](https://github.com/ozum/pg-test-util/blob/569dcb4/src/database.ts#L180)

<a name="classesdefaultmd"></a>

[pg-test-util](#readmemd) / default

# Class: default

PgTestUtil class is used to perform PostgreSQL operations related to unit testing such as create database, truncate database and drop database etc.

## Table of contents

### Methods

- [cleanup](#cleanup)
- [copyDatabase](#copydatabase)
- [createDatabase](#createdatabase)
- [createUser](#createuser)
- [disconnect](#disconnect)
- [disconnectAll](#disconnectall)
- [dropAll](#dropall)
- [dropAllDatabases](#dropalldatabases)
- [dropAllUsers](#dropallusers)
- [dropConnections](#dropconnections)
- [dropDatabase](#dropdatabase)
- [dropUser](#dropuser)
- [fetcAllDatabaseNames](#fetcalldatabasenames)
- [getDatabase](#getdatabase)
- [getUserNames](#getusernames)
- [query](#query)
- [new](#new)

## Methods

### cleanup

▸ **cleanup**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[pg-test-util.ts:304](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L304)

---

### copyDatabase

▸ **copyDatabase**(`options`): `Promise`<[`Database`](#classesdatabasemd)\>

Copies a given database with a new name.

#### Parameters

| Name              | Type                                         | Description                                                  |
| :---------------- | :------------------------------------------- | :----------------------------------------------------------- |
| `options`         | `Object`                                     | is configuration.                                            |
| `options.drop?`   | `boolean`                                    | is whether to drop target database before copy.              |
| `options.safe?`   | `boolean`                                    | If true, only databases created by this instance is dropped. |
| `options.source?` | `string` \| [`Database`](#classesdatabasemd) | -                                                            |
| `options.target?` | `string` \| [`Database`](#classesdatabasemd) | -                                                            |

#### Returns

`Promise`<[`Database`](#classesdatabasemd)\>

[Database](#classesdatabasemd) object.

#### Defined in

[pg-test-util.ts:183](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L183)

---

### createDatabase

▸ **createDatabase**(`options?`): `Promise`<[`Database`](#classesdatabasemd)\>

Creates a database. If name is not provided generates a name using `baseName` from constructor and part of epoch time.

#### Parameters

| Name                | Type      | Description                                                   |
| :------------------ | :-------- | :------------------------------------------------------------ |
| `options`           | `Object`  | is configuration                                              |
| `options.drop?`     | `boolean` | is whether to drop database before create command.            |
| `options.encoding?` | `string`  | is database encoding                                          |
| `options.file?`     | `string`  | is SQL query file to execute on database after it is created. |
| `options.name?`     | `string`  | is database name                                              |
| `options.safe?`     | `boolean` | If true, only databases created by this instance is dropped.  |
| `options.sql?`      | `string`  | is SQL query to execute on database after it is created.      |
| `options.template?` | `string`  | is database template to use.                                  |

#### Returns

`Promise`<[`Database`](#classesdatabasemd)\>

[Database](#classesdatabasemd) object representing created database.

#### Defined in

[pg-test-util.ts:142](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L142)

---

### createUser

▸ **createUser**(`user`, `password`): `Promise`<`void`\>

Creates a new database user if it does not exist.

#### Parameters

| Name       | Type     | Description                   |
| :--------- | :------- | :---------------------------- |
| `user`     | `string` | is the name of the user.      |
| `password` | `string` | is the password for the user. |

#### Returns

`Promise`<`void`\>

#### Defined in

[pg-test-util.ts:250](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L250)

---

### disconnect

▸ **disconnect**(): `Promise`<`void`\>

Disconnects admin client.

#### Returns

`Promise`<`void`\>

#### Defined in

[pg-test-util.ts:103](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L103)

---

### disconnectAll

▸ **disconnectAll**(`options?`): `Promise`<`void`[]\>

Disconnects all clients.

#### Parameters

| Name            | Type                     | Description                         |
| :-------------- | :----------------------- | :---------------------------------- |
| `options`       | `Object`                 | are options.                        |
| `options.admin` | `undefined` \| `boolean` | whether to disconnect admin client. |

#### Returns

`Promise`<`void`[]\>

#### Defined in

[pg-test-util.ts:117](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L117)

---

### dropAll

▸ **dropAll**(`options?`): `Promise`<`void`\>

Drops all items created by this instance.

#### Parameters

| Name                 | Type                     | Description                            |
| :------------------- | :----------------------- | :------------------------------------- |
| `options`            | `Object`                 | are options.                           |
| `options.disconnect` | `undefined` \| `boolean` | is whether to disconnect admin client. |

#### Returns

`Promise`<`void`\>

#### Defined in

[pg-test-util.ts:300](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L300)

---

### dropAllDatabases

▸ **dropAllDatabases**(`options?`): `Promise`<`void`\>

Drops all databases created by this instance.

#### Parameters

| Name                 | Type                     | Description                            |
| :------------------- | :----------------------- | :------------------------------------- |
| `options`            | `Object`                 | are options.                           |
| `options.disconnect` | `undefined` \| `boolean` | is whether to disconnect admin client. |

#### Returns

`Promise`<`void`\>

#### Defined in

[pg-test-util.ts:239](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L239)

---

### dropAllUsers

▸ **dropAllUsers**(): `Promise`<`void`\>

Drops all users created by this instance.

#### Returns

`Promise`<`void`\>

#### Defined in

[pg-test-util.ts:289](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L289)

---

### dropConnections

▸ **dropConnections**(`databaseName`): `Promise`<`void`\>

#### Parameters

| Name           | Type     |
| :------------- | :------- |
| `databaseName` | `string` |

#### Returns

`Promise`<`void`\>

#### Defined in

[pg-test-util.ts:229](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L229)

---

### dropDatabase

▸ **dropDatabase**(`database?`, `options?`): `Promise`<`void`\>

Drops given database. To ensure the task, drops all connections to the database beforehand.
If `dropOnlyCreated` is true and database is not created by this instance, throws error.

#### Parameters

| Name           | Type                                         | Description                                                          |
| :------------- | :------------------------------------------- | :------------------------------------------------------------------- |
| `database`     | `string` \| [`Database`](#classesdatabasemd) | is database name or [Database](#classesdatabasemd) instance to drop. |
| `options`      | `Object`                                     | are options                                                          |
| `options.safe` | `undefined` \| `boolean`                     | If true, only databases created by this instance is dropped.         |

#### Returns

`Promise`<`void`\>

#### Defined in

[pg-test-util.ts:211](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L211)

---

### dropUser

▸ **dropUser**(`user`, `options?`): `Promise`<`void`\>

Drops database user.

#### Parameters

| Name           | Type                     | Description                                              |
| :------------- | :----------------------- | :------------------------------------------------------- |
| `user`         | `string`                 | is user name to drop.                                    |
| `options`      | `Object`                 | are options.                                             |
| `options.safe` | `undefined` \| `boolean` | If true, only users created by this instance is dropped. |

#### Returns

`Promise`<`void`\>

#### Defined in

[pg-test-util.ts:280](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L280)

---

### fetcAllDatabaseNames

▸ **fetcAllDatabaseNames**(`onlyCreated`): `Promise`<`string`[]\>

Fetches the list of all databases from server.

#### Parameters

| Name          | Type      |
| :------------ | :-------- |
| `onlyCreated` | `boolean` |

#### Returns

`Promise`<`string`[]\>

#### Defined in

[pg-test-util.ts:124](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L124)

---

### getDatabase

▸ **getDatabase**(`name?`): `Promise`<[`Database`](#classesdatabasemd)\>

Returns `Database` instance object for given database name. Also connects to database if it is not connected.
If no connection details are provided, default database is returned using same connection parameters as master database.

#### Parameters

| Name   | Type     | Description                                                                     |
| :----- | :------- | :------------------------------------------------------------------------------ |
| `name` | `string` | is database name to get instance for. `defaultDatabaseName` is used by default. |

#### Returns

`Promise`<[`Database`](#classesdatabasemd)\>

[Database](#classesdatabasemd) instance for given database name.

#### Defined in

[pg-test-util.ts:90](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L90)

---

### getUserNames

▸ **getUserNames**(`onlyCreated?`): `Promise`<`string`[]\>

Fetches database users from database.

#### Parameters

| Name          | Type      | Default value | Description                                                      |
| :------------ | :-------- | :------------ | :--------------------------------------------------------------- |
| `onlyCreated` | `boolean` | `false`       | is whether to fetch users only created by this utility instance. |

#### Returns

`Promise`<`string`[]\>

array of usernames.

#### Defined in

[pg-test-util.ts:267](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L267)

---

### query

▸ **query**<`T`\>(`sql`, `params?`): `Promise`<`T`[]\>

Executes given SQL in admin clinet and returns result rows.
Admin client can be used fro administration queries such as creating databases etc.

#### Type parameters

| Name | Type  | Description                                   |
| :--- | :---- | :-------------------------------------------- |
| `T`  | `any` | is type for single row returned by SQL query. |

#### Parameters

| Name      | Type     | Description                            |
| :-------- | :------- | :------------------------------------- |
| `sql`     | `string` | is sql query.                          |
| `params?` | `any`[]  | are array of parameters to pass query. |

#### Returns

`Promise`<`T`[]\>

result rows of the SQL query.

#### Defined in

[pg-test-util.ts:75](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L75)

---

### new

▸ `Static` **new**(`connection`, `options?`): `Promise`<[`default`](#classesdefaultmd)\>

Create an instance.

#### Parameters

| Name         | Type                                   | Description                                                  |
| :----------- | :------------------------------------- | :----------------------------------------------------------- |
| `connection` | `string` \| `Client` \| `ClientConfig` | is the `pg.client` or connection parameters for `pg.client`. |
| `options`    | [`Options`](#interfacesoptionsmd)      | are options.                                                 |

#### Returns

`Promise`<[`default`](#classesdefaultmd)\>

#### Defined in

[pg-test-util.ts:39](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L39)

# Interfaces

<a name="interfacesoptionsmd"></a>

[pg-test-util](#readmemd) / Options

# Interface: Options

## Table of contents

### Properties

- [baseName](#basename)
- [cleanupOnError](#cleanuponerror)
- [safe](#safe)

## Properties

### baseName

• `Optional` **baseName**: `string`

#### Defined in

[pg-test-util.ts:9](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L9)

---

### cleanupOnError

• `Optional` **cleanupOnError**: `boolean`

#### Defined in

[pg-test-util.ts:10](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L10)

---

### safe

• `Optional` **safe**: `boolean`

#### Defined in

[pg-test-util.ts:8](https://github.com/ozum/pg-test-util/blob/569dcb4/src/pg-test-util.ts#L8)

<%_ } _%>
