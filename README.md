<!-- DO NOT EDIT README.md (It will be overridden by README.hbs) -->

# pg-test-util

Utility library for administrative database operations.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Description](#description)
- [Synopsis](#synopsis)
  - [Single Database](#single-database)
  - [Multiple Databases](#multiple-databases)
  - [Unit Tests (Jest, Mocha, Lab etc.)](#unit-tests-jest-mocha-lab-etc)
- [API](#api)
  - [Classes](#classes)
  - [Typedefs](#typedefs)
  - [Database](#database)
    - [new Database([connection], [schemas], preError, drop)](#new-databaseconnection-schemas-preerror-drop)
    - [database.name : <code>string</code>](#databasename--codestringcode)
    - [database.isConnected : <code>boolean</code>](#databaseisconnected--codebooleancode)
    - [database.knex : <code>knex</code>](#databaseknex--codeknexcode)
    - [database.disconnect() ⇒ <code>Promise.&lt;void&gt;</code>](#databasedisconnect-%E2%87%92-codepromiseltvoidgtcode)
    - [database.refresh() ⇒ <code>void</code>](#databaserefresh-%E2%87%92-codevoidcode)
    - [database.getTables() ⇒ <code>Promise.&lt;Array.&lt;{schema: string, table: string}&gt;&gt;</code>](#databasegettables-%E2%87%92-codepromiseltarrayltschema-string-table-stringgtgtcode)
    - [database.getSequences() ⇒ <code>Promise.&lt;Array.&lt;{schema: string, table: string, column: string, sequence: string}&gt;&gt;</code>](#databasegetsequences-%E2%87%92-codepromiseltarrayltschema-string-table-string-column-string-sequence-stringgtgtcode)
    - [database.updateSequences() ⇒ <code>Promise.&lt;void&gt;</code>](#databaseupdatesequences-%E2%87%92-codepromiseltvoidgtcode)
    - [database.truncate([ignoreTables]) ⇒ <code>Promise.&lt;knex.QueryBuilder&gt;</code>](#databasetruncateignoretables-%E2%87%92-codepromiseltknexquerybuildergtcode)
    - [database.queryFile(file) ⇒ <code>Promise.&lt;knex.QueryBuilder&gt;</code>](#databasequeryfilefile-%E2%87%92-codepromiseltknexquerybuildergtcode)
    - [database.query(sql) ⇒ <code>Promise.&lt;knex.QueryBuilder&gt;</code>](#databasequerysql-%E2%87%92-codepromiseltknexquerybuildergtcode)
    - [database.drop() ⇒ <code>Promise.&lt;void&gt;</code>](#databasedrop-%E2%87%92-codepromiseltvoidgtcode)
  - [PgTestUtil](#pgtestutil)
    - [new PgTestUtil([config], [defaultDatabase], [dropOnlyCreated], [disconnectOnError])](#new-pgtestutilconfig-defaultdatabase-droponlycreated-disconnectonerror)
    - [pgTestUtil.isConnected : <code>boolean</code>](#pgtestutilisconnected--codebooleancode)
    - [pgTestUtil.defaultDatabaseName : <code>string</code>](#pgtestutildefaultdatabasename--codestringcode)
    - [pgTestUtil.getDatabaseListFromServer() ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>](#pgtestutilgetdatabaselistfromserver-%E2%87%92-codepromiseltarrayltstringgtgtcode)
    - [pgTestUtil.generateName() ⇒ <code>string</code>](#pgtestutilgeneratename-%E2%87%92-codestringcode)
    - [pgTestUtil.getDatabase([name]) ⇒ <code>Database</code>](#pgtestutilgetdatabasename-%E2%87%92-codedatabasecode)
    - [pgTestUtil.disconnect() ⇒ <code>Promise.&lt;void&gt;</code>](#pgtestutildisconnect-%E2%87%92-codepromiseltvoidgtcode)
    - [pgTestUtil.disconnectAll([config]) ⇒ <code>Promise.&lt;Array.&lt;void&gt;&gt;</code>](#pgtestutildisconnectallconfig-%E2%87%92-codepromiseltarrayltvoidgtgtcode)
    - [pgTestUtil.createUser(user, password) ⇒ <code>Promise.&lt;QueryResult&gt;</code>](#pgtestutilcreateuseruser-password-%E2%87%92-codepromiseltqueryresultgtcode)
    - [pgTestUtil.getUsers() ⇒ <code>Promise.&lt;QueryResult&gt;</code>](#pgtestutilgetusers-%E2%87%92-codepromiseltqueryresultgtcode)
    - [pgTestUtil.dropUser(user, [config]) ⇒ <code>Promise.&lt;void&gt;</code>](#pgtestutildropuseruser-config-%E2%87%92-codepromiseltvoidgtcode)
    - [pgTestUtil.dropAllUsers() ⇒ <code>Promise.&lt;void&gt;</code>](#pgtestutildropallusers-%E2%87%92-codepromiseltvoidgtcode)
    - [pgTestUtil.createDatabase([config]) ⇒ <code>Promise.&lt;Database&gt;</code>](#pgtestutilcreatedatabaseconfig-%E2%87%92-codepromiseltdatabasegtcode)
    - [pgTestUtil.copyDatabase(config, [from], to, [drop]) ⇒ <code>Promise.&lt;Database&gt;</code>](#pgtestutilcopydatabaseconfig-from-to-drop-%E2%87%92-codepromiseltdatabasegtcode)
    - [pgTestUtil.dropDatabase([database], [config]) ⇒ <code>Promise.&lt;void&gt;</code>](#pgtestutildropdatabasedatabase-config-%E2%87%92-codepromiseltvoidgtcode)
    - [pgTestUtil.dropAllDatabases([config], [disconnect]) ⇒ <code>Promise.&lt;void&gt;</code>](#pgtestutildropalldatabasesconfig-disconnect-%E2%87%92-codepromiseltvoidgtcode)
    - [pgTestUtil.dropAll([config], [disconnect]) ⇒ <code>Promise.&lt;void&gt;</code>](#pgtestutildropallconfig-disconnect-%E2%87%92-codepromiseltvoidgtcode)
  - [ConnectionConfig : <code>Object</code>](#connectionconfig--codeobjectcode)
  - [PartialConnectionConfig : <code>Object</code>](#partialconnectionconfig--codeobjectcode)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Description

Utility library for creating, dropping, truncating and similar operations related to PostgreSQL.
It uses `knex` for individual databases, and `pg` driver for disconnect connection.

It is ideal to use in unit tests. Also has typescript support.

# Synopsis

```
import PgTestUtil from 'pg-test-util';
const PgTestUtil = require('pg-test-util').default;

const pgTestUtil = new PgTestUtil();
const db = pgTestUtil.createDatabase('my_database');
```

## Single Database

```js
import PgTestUtil from 'pg-test-util';

const pgTestUtil = new PgTestUtil();                  // Uses connection string from: process.env.PG_TEST_CONNECTION_STRING

db = pgTestUtil.createDatabase();                     // No name given, so creates test-db-26352723 (number will be different)
db.knex('books').insert({title: 'Master Node JS'});   // Get knex of database.
db.truncate(['preData']);                             // Truncates all tables except preData
pgTestUtil.dropDatabase();                            // Drops created db.
```

## Multiple Databases

```js
import PgTestUtil from 'pg-test-util';

const pgTestUtil = new PgTestUtil({
  baseName:         'my-project',             // Base name for auto generated names.
  defaultDatabase:  'main-db',                // Database to use if no db name provided.
  connection: {
    connectionString: 'postgresql://user:password@127.0.0.1:5432/template1',
  }
});

db1 = pgTestUtil.createDatabase();                  // No name given, so creates my-project-63526273 (number will be different)
db2 = pgTestUtil.createDatabase({name: 'main-db'}); // Creates main-db, which is also defined as default database in constructor.
db3 = pgTestUtil.createDatabase({name: 'some-db'}); // Creates some-db
db2.truncate(['preData']);                          // Truncates all tables in main-db except preData
db1.drop();                                         // Drops my-project-63526273 database. (Database#drop())
pgTestUtil.dropDatabase();                          // Drops default db (main-db). (PgTestUtil#dropDatabase())
pgTestUtil.dropDatabase('some-db');                 // Drops default db (some-db). (PgTestUtil#dropDatabase())
```

## Unit Tests (Jest, Mocha, Lab etc.)

```js
import PgTestUtil from 'pg-test-util';

const pgTestUtil = new PgTestUtil();
let knex;
let database;

beforeAll(async () => {
  database = await pgTestUtil.createDatabase({
    drop: true,
    name: 'my-test-db',
    file: `${__dirname}/__test-supplements__/create-db.sql`,
  });

  ({ knex } = database);
});

afterAll(async () => {
  await pgTestUtil.dropAllDatabases(); // To inspect without drop use: await pgTestUtil.disconnectAll({ disconnect: true });
});

describe('csv', () => {
  beforeEach(async () => {
    await database.truncate();
  });

  it('should have expected records.', async () => {
    const { count } = (await knex('MyYable').count('*'))[0];
    expect(count).toEqual(5);
  });
});

```


# API
## Classes

<dl>
<dt><a href="#Database">Database</a></dt>
<dd><p>Database class is used for tasks related to individual database such as connecting, querying, getting tables, getting sequences etc.</p></dd>
<dt><a href="#PgTestUtil">PgTestUtil</a></dt>
<dd><p>PgTestUtil class is used to perform PostgreSQL operations related to unit testing such as create database, truncate database and
drop database etc.</p></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#ConnectionConfig">ConnectionConfig</a> : <code>Object</code></dt>
<dd><p>Connection parameters object. Fills individual parameters from connection string or vice versa and returns
fully filled object.</p></dd>
<dt><a href="#PartialConnectionConfig">PartialConnectionConfig</a> : <code>Object</code></dt>
<dd><p>Partial version of <code>ConnectionConfig</code></p></dd>
</dl>

<a name="Database"></a>

## Database
<p>Database class is used for tasks related to individual database such as connecting, querying, getting tables, getting sequences etc.</p>

**Kind**: global class  
**Access**: public  

* [Database](#Database)
    * [new Database([connection], [schemas], preError, drop)](#new_Database_new)
    * [.name](#Database+name) : <code>string</code>
    * [.isConnected](#Database+isConnected) : <code>boolean</code>
    * [.knex](#Database+knex) : <code>knex</code>
    * [.disconnect()](#Database+disconnect) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.refresh()](#Database+refresh) ⇒ <code>void</code>
    * [.getTables()](#Database+getTables) ⇒ <code>Promise.&lt;Array.&lt;{schema: string, table: string}&gt;&gt;</code>
    * [.getSequences()](#Database+getSequences) ⇒ <code>Promise.&lt;Array.&lt;{schema: string, table: string, column: string, sequence: string}&gt;&gt;</code>
    * [.updateSequences()](#Database+updateSequences) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.truncate([ignoreTables])](#Database+truncate) ⇒ <code>Promise.&lt;knex.QueryBuilder&gt;</code>
    * [.queryFile(file)](#Database+queryFile) ⇒ <code>Promise.&lt;knex.QueryBuilder&gt;</code>
    * [.query(sql)](#Database+query) ⇒ <code>Promise.&lt;knex.QueryBuilder&gt;</code>
    * [.drop()](#Database+drop) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="new_Database_new"></a>

### new Database([connection], [schemas], preError, drop)
<p>Returns connection parameters object. Fills individual parameters from connection string or vice versa and returns
fully filled object.</p>


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [connection] | [<code>PartialConnectionConfig</code>](#PartialConnectionConfig) |  | <p>Connection string as <code>postgresql://name:pass@127.0.0.1:5432/template1</code></p> |
| [schemas] | <code>Array.&lt;string&gt;</code> | <code>[&#x27;public&#x27;]</code> | <p>Schemas to include in utility functions.</p> |
| preError | <code>function</code> |  | <p>Error function to call before throwing any error.</p> |
| drop | <code>function</code> |  | <p>Function to drop this database. (Because it needs master connection)</p> |

<a name="Database+name"></a>

### database.name : <code>string</code>
<p>Gets database name.</p>

**Kind**: instance property of [<code>Database</code>](#Database)  
**Read only**: true  
<a name="Database+isConnected"></a>

### database.isConnected : <code>boolean</code>
<p>Gets connection status of database.</p>

**Kind**: instance property of [<code>Database</code>](#Database)  
**Read only**: true  
<a name="Database+knex"></a>

### database.knex : <code>knex</code>
<p>Gets <code>knex</code> object for database.</p>

**Kind**: instance property of [<code>Database</code>](#Database)  
**Read only**: true  
<a name="Database+disconnect"></a>

### database.disconnect() ⇒ <code>Promise.&lt;void&gt;</code>
<p>Disconnects from database.</p>

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>Promise.&lt;void&gt;</code> - <p>Void promise.</p>  
**Throws**:

- <p>Throws error if disconnection fails.</p>

<a name="Database+refresh"></a>

### database.refresh() ⇒ <code>void</code>
<p>Clears tables and sequences cache.</p>

**Kind**: instance method of [<code>Database</code>](#Database)  
<a name="Database+getTables"></a>

### database.getTables() ⇒ <code>Promise.&lt;Array.&lt;{schema: string, table: string}&gt;&gt;</code>
<p>Returns tables from database. Uses cache for fast results. Use <code>refresh()</code> method to refresh the cache.</p>

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>Promise.&lt;Array.&lt;{schema: string, table: string}&gt;&gt;</code> - <p>Information about tables.</p>  
**Throws**:

- <p>Throws error if query fails.</p>

<a name="Database+getSequences"></a>

### database.getSequences() ⇒ <code>Promise.&lt;Array.&lt;{schema: string, table: string, column: string, sequence: string}&gt;&gt;</code>
<p>Returns sequences from database. Uses cache for fast results. Use <code>refresh()</code> method to refresh the cache.</p>

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>Promise.&lt;Array.&lt;{schema: string, table: string, column: string, sequence: string}&gt;&gt;</code> - <p>Information about sequences</p>  
**Throws**:

- <p>Throws error if query fails.</p>

<a name="Database+updateSequences"></a>

### database.updateSequences() ⇒ <code>Promise.&lt;void&gt;</code>
<p>Set current value of sequence for each column of all tables based on record with maximum number. If there are no record in the table, the value will be set to 1.</p>

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>Promise.&lt;void&gt;</code> - <ul>
<li>Promise of all queries.</li>
</ul>  
**Throws**:

- <p>Throws error if query fails.</p>

<a name="Database+truncate"></a>

### database.truncate([ignoreTables]) ⇒ <code>Promise.&lt;knex.QueryBuilder&gt;</code>
<p>Truncates all tables in database.</p>

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>Promise.&lt;knex.QueryBuilder&gt;</code> - <ul>
<li>Promise of all queries.</li>
</ul>  
**Throws**:

- <p>Throws error if query fails.</p>


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [ignoreTables] | <code>Array.&lt;string&gt;</code> | <code>[]</code> | <p>Tables to ignore.</p> |

<a name="Database+queryFile"></a>

### database.queryFile(file) ⇒ <code>Promise.&lt;knex.QueryBuilder&gt;</code>
<p>Reads and executes SQL in given file.</p>

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>Promise.&lt;knex.QueryBuilder&gt;</code> - <ul>
<li>Promise of SQL query.</li>
</ul>  
**Throws**:

- <p>Throws error if query fails.</p>


| Param | Type | Description |
| --- | --- | --- |
| file | <code>string</code> | <p>File to read SQL from</p> |

<a name="Database+query"></a>

### database.query(sql) ⇒ <code>Promise.&lt;knex.QueryBuilder&gt;</code>
<p>Executes given SQL.</p>

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>Promise.&lt;knex.QueryBuilder&gt;</code> - <ul>
<li>Promise of SQL query.</li>
</ul>  
**Throws**:

- <p>Throws error if query fails.</p>


| Param | Type | Description |
| --- | --- | --- |
| sql | <code>string</code> \| <code>Array.&lt;string&gt;</code> | <p>SQL to execute.</p> |

<a name="Database+drop"></a>

### database.drop() ⇒ <code>Promise.&lt;void&gt;</code>
<p>Drops database.</p>

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>Promise.&lt;void&gt;</code> - <ul>
<li>Void</li>
</ul>  
**Throws**:

- <ul>
<li>Throws error if drop operation fails.</li>
</ul>

<a name="PgTestUtil"></a>

## PgTestUtil
<p>PgTestUtil class is used to perform PostgreSQL operations related to unit testing such as create database, truncate database and
drop database etc.</p>

**Kind**: global class  
**Access**: public  

* [PgTestUtil](#PgTestUtil)
    * [new PgTestUtil([config], [defaultDatabase], [dropOnlyCreated], [disconnectOnError])](#new_PgTestUtil_new)
    * [.isConnected](#PgTestUtil+isConnected) : <code>boolean</code>
    * [.defaultDatabaseName](#PgTestUtil+defaultDatabaseName) : <code>string</code>
    * [.getDatabaseListFromServer()](#PgTestUtil+getDatabaseListFromServer) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
    * [.generateName()](#PgTestUtil+generateName) ⇒ <code>string</code>
    * [.getDatabase([name])](#PgTestUtil+getDatabase) ⇒ [<code>Database</code>](#Database)
    * [.disconnect()](#PgTestUtil+disconnect) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.disconnectAll([config])](#PgTestUtil+disconnectAll) ⇒ <code>Promise.&lt;Array.&lt;void&gt;&gt;</code>
    * [.createUser(user, password)](#PgTestUtil+createUser) ⇒ <code>Promise.&lt;QueryResult&gt;</code>
    * [.getUsers()](#PgTestUtil+getUsers) ⇒ <code>Promise.&lt;QueryResult&gt;</code>
    * [.dropUser(user, [config])](#PgTestUtil+dropUser) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.dropAllUsers()](#PgTestUtil+dropAllUsers) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.createDatabase([config])](#PgTestUtil+createDatabase) ⇒ [<code>Promise.&lt;Database&gt;</code>](#Database)
    * [.copyDatabase(config, [from], to, [drop])](#PgTestUtil+copyDatabase) ⇒ [<code>Promise.&lt;Database&gt;</code>](#Database)
    * [.dropDatabase([database], [config])](#PgTestUtil+dropDatabase) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.dropAllDatabases([config], [disconnect])](#PgTestUtil+dropAllDatabases) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.dropAll([config], [disconnect])](#PgTestUtil+dropAll) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="new_PgTestUtil_new"></a>

### new PgTestUtil([config], [defaultDatabase], [dropOnlyCreated], [disconnectOnError])
<p>Creates an instance of PgTestUtil.</p>


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [config] | <code>PgTestUtilConfig</code> |  | <p>Configuration</p> |
| [config.baseName] | <code>string</code> | <code>&quot;&#x27;test-db&#x27;&quot;</code> | <p>Base name to use if database name is provided during database creation.</p> |
| [config.connection] | [<code>PartialConnectionConfig</code>](#PartialConnectionConfig) |  | <p>Connection parameters for connecting master database. If not provided, <code>process.env.PG_TEST_CONNECTION_STRING</code> is used.</p> |
| [defaultDatabase] | <code>string</code> |  | <p>Default database name to use in queries. If not provided, first created database is used.</p> |
| [dropOnlyCreated] | <code>boolean</code> | <code>true</code> | <p>If true, <code>drop</code> method does not drop databases which are not created by this object instance.</p> |
| [disconnectOnError] | <code>boolean</code> | <code>false</code> | <p>Disconnects from all databases on error caused by this instance. (Should not be used in unit tests. Disconnect or drop in <code>afterAll</code> method of testing library.)</p> |

<a name="PgTestUtil+isConnected"></a>

### pgTestUtil.isConnected : <code>boolean</code>
<p>Gets connection status.</p>

**Kind**: instance property of [<code>PgTestUtil</code>](#PgTestUtil)  
**Read only**: true  
<a name="PgTestUtil+defaultDatabaseName"></a>

### pgTestUtil.defaultDatabaseName : <code>string</code>
<p>Gets default database name which determined algorithm below:</p>
<ol>
<li><code>defaultDatabase</code> name provided during instance creation.</li>
<li>If only one database is created, created database.</li>
<li>Cannot be determined a default database name.</li>
</ol>

**Kind**: instance property of [<code>PgTestUtil</code>](#PgTestUtil)  
**Throws**:

- <p>Throws error if no default database name can be determinded.</p>

**Read only**: true  
<a name="PgTestUtil+getDatabaseListFromServer"></a>

### pgTestUtil.getDatabaseListFromServer() ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
<p>Fetches and returns list of databases from server.</p>

**Kind**: instance method of [<code>PgTestUtil</code>](#PgTestUtil)  
**Returns**: <code>Promise.&lt;Array.&lt;string&gt;&gt;</code> - <ul>
<li>List of databases.</li>
</ul>  
**Throws**:

- <code>Error</code> <ul>
<li>Throws error if it cannot get databases from server.</li>
</ul>

<a name="PgTestUtil+generateName"></a>

### pgTestUtil.generateName() ⇒ <code>string</code>
<p>Generates a unique database name. Uniqueness of database name is not generated useing an advanced
algorithm or technique. Simply epoch time is used.</p>

**Kind**: instance method of [<code>PgTestUtil</code>](#PgTestUtil)  
**Returns**: <code>string</code> - <ul>
<li>Unique database name</li>
</ul>  
<a name="PgTestUtil+getDatabase"></a>

### pgTestUtil.getDatabase([name]) ⇒ [<code>Database</code>](#Database)
<p>Returns <code>Database</code> instance object for given database name. Also connects to database if it is not connected.
If no connection details are provided, default database is returned using same connection parameters as master database.</p>

**Kind**: instance method of [<code>PgTestUtil</code>](#PgTestUtil)  
**Returns**: [<code>Database</code>](#Database) - <ul>
<li><code>Database</code> instance for given database name.</li>
</ul>  
**Throws**:

- <ul>
<li>Throws error if database cannot be connected.</li>
</ul>


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [name] | <code>string</code> | <code>&quot;this.defaultDatabaseName&quot;</code> | <p>Database name to get instance for.</p> |

<a name="PgTestUtil+disconnect"></a>

### pgTestUtil.disconnect() ⇒ <code>Promise.&lt;void&gt;</code>
<p>Disconnects from master database.</p>

**Kind**: instance method of [<code>PgTestUtil</code>](#PgTestUtil)  
**Returns**: <code>Promise.&lt;void&gt;</code> - <ul>
<li>Query result.</li>
</ul>  
**Throws**:

- <ul>
<li>Throws error if query fails.</li>
</ul>

<a name="PgTestUtil+disconnectAll"></a>

### pgTestUtil.disconnectAll([config]) ⇒ <code>Promise.&lt;Array.&lt;void&gt;&gt;</code>
<p>Disconnects from all databases.</p>

**Kind**: instance method of [<code>PgTestUtil</code>](#PgTestUtil)  
**Returns**: <code>Promise.&lt;Array.&lt;void&gt;&gt;</code> - <ul>
<li>Void promise</li>
</ul>  
**Throws**:

- <ul>
<li>Throws error if cannot disconnect from databases.</li>
</ul>


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [config] | <code>Object</code> |  | <p>Configuration</p> |
| [config.master] | <code>boolean</code> | <code>true</code> | <p>If true, it disconnects from master database too.</p> |

<a name="PgTestUtil+createUser"></a>

### pgTestUtil.createUser(user, password) ⇒ <code>Promise.&lt;QueryResult&gt;</code>
<p>Creates a new database user.</p>

**Kind**: instance method of [<code>PgTestUtil</code>](#PgTestUtil)  
**Returns**: <code>Promise.&lt;QueryResult&gt;</code> - <ul>
<li>Query result promise.</li>
</ul>  
**Throws**:

- <ul>
<li>Throws error if user cannot be created.</li>
</ul>


| Param | Type | Description |
| --- | --- | --- |
| user | <code>string</code> | <p>User name to create</p> |
| password | <code>string</code> | <p>Password for created user.</p> |

<a name="PgTestUtil+getUsers"></a>

### pgTestUtil.getUsers() ⇒ <code>Promise.&lt;QueryResult&gt;</code>
<p>Returns database users.</p>

**Kind**: instance method of [<code>PgTestUtil</code>](#PgTestUtil)  
**Returns**: <code>Promise.&lt;QueryResult&gt;</code> - <ul>
<li>Database users as [{ name: 'user1' }, ...]</li>
</ul>  
**Throws**:

- <ul>
<li>Throws error if quer fails to get users.</li>
</ul>

<a name="PgTestUtil+dropUser"></a>

### pgTestUtil.dropUser(user, [config]) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Drops database user. If</p>

**Kind**: instance method of [<code>PgTestUtil</code>](#PgTestUtil)  
**Returns**: <code>Promise.&lt;void&gt;</code> - <ul>
<li>void.</li>
</ul>  
**Throws**:

- <ul>
<li>Throws error if user cannot be dropped.</li>
</ul>


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| user | <code>string</code> |  | <p>User name to drop</p> |
| [config] | <code>Object</code> |  | <p>Configuration</p> |
| [config.dropOnlyCreated] | <code>boolean</code> | <code>&#x60;dropOnlyCreated&#x60; of instance</code> | <p>Safety precaution. If true, only databases created by this instance is dropped.</p> |

<a name="PgTestUtil+dropAllUsers"></a>

### pgTestUtil.dropAllUsers() ⇒ <code>Promise.&lt;void&gt;</code>
<p>Drops all users created by this instance.</p>

**Kind**: instance method of [<code>PgTestUtil</code>](#PgTestUtil)  
**Returns**: <code>Promise.&lt;void&gt;</code> - <ul>
<li>Void</li>
</ul>  
**Throws**:

- <ul>
<li>Throws error if any user cannot be dropped.</li>
</ul>

<a name="PgTestUtil+createDatabase"></a>

### pgTestUtil.createDatabase([config]) ⇒ [<code>Promise.&lt;Database&gt;</code>](#Database)
<p>Creates a database. If name is not provided generates a name using <code>baseName</code> from constructor and part of epoch time.</p>

**Kind**: instance method of [<code>PgTestUtil</code>](#PgTestUtil)  
**Returns**: [<code>Promise.&lt;Database&gt;</code>](#Database) - <ul>
<li><code>Database</code> object representing created database.</li>
</ul>  
**Throws**:

- <ul>
<li>Throws error if database creation fails.</li>
</ul>


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [config] | <code>Object</code> |  | <p>Configuration</p> |
| [config.name] | <code>string</code> | <code>&quot;this.generateName()&quot;</code> | <p>Database name</p> |
| [config.encoding] | <code>string</code> | <code>&quot;&#x27;UTF8&#x27;&quot;</code> | <p>Database encoding</p> |
| [config.template] | <code>string</code> | <code>&quot;&#x27;template0&#x27;&quot;</code> | <p>Database template to use.</p> |
| [config.sql] | <code>string</code> |  | <p>SQL query to execute on database after it is created.</p> |
| [config.file] | <code>string</code> |  | <p>SQL query file to execute on database after it is created.</p> |
| [config.drop] | <code>boolean</code> | <code>false</code> | <p>If true, database is dropped before create command.</p> |

<a name="PgTestUtil+copyDatabase"></a>

### pgTestUtil.copyDatabase(config, [from], to, [drop]) ⇒ [<code>Promise.&lt;Database&gt;</code>](#Database)
<p>Copies a given database with a new name.</p>

**Kind**: instance method of [<code>PgTestUtil</code>](#PgTestUtil)  
**Returns**: [<code>Promise.&lt;Database&gt;</code>](#Database) - <ul>
<li>Query result.</li>
</ul>  
**Throws**:

- <ul>
<li>Throws error if copy task fails.</li>
</ul>


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| config | <code>Object</code> |  | <p>Configuration</p> |
| [from] | <code>string</code> \| [<code>Database</code>](#Database) | <code>&quot;this.defaultDatabaseName&quot;</code> | <p>Source database name or <code>Database</code> instance to copy from.</p> |
| to | <code>string</code> \| [<code>Database</code>](#Database) |  | <p>Target database name or <code>Database</code> instance to copy to.</p> |
| [drop] | <code>boolean</code> | <code>false</code> | <p>Drop target database before copy if exists.</p> |

<a name="PgTestUtil+dropDatabase"></a>

### pgTestUtil.dropDatabase([database], [config]) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Drops given database. To ensure the task, drops all connections to the database beforehand.
If <code>dropOnlyCreated</code> is true and database is not created by this instance, throws error.</p>

**Kind**: instance method of [<code>PgTestUtil</code>](#PgTestUtil)  
**Returns**: <code>Promise.&lt;void&gt;</code> - <ul>
<li>Void</li>
</ul>  
**Throws**:

- <ul>
<li>Throws error if database cannot be dropped.</li>
</ul>


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [database] | <code>string</code> | <code>&quot;this.defaultDatabaseName&quot;</code> | <p>Database name or <code>Database</code> instance to drop.</p> |
| [config] | <code>Object</code> |  | <p>Configuration.</p> |
| [config.dropOnlyCreated] | <code>boolean</code> | <code>&#x60;dropOnlyCreated&#x60; of instance</code> | <p>Safety precaution. If true, only databases created by this instance is dropped.</p> |

<a name="PgTestUtil+dropAllDatabases"></a>

### pgTestUtil.dropAllDatabases([config], [disconnect]) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Drops all databases created by this instance.</p>

**Kind**: instance method of [<code>PgTestUtil</code>](#PgTestUtil)  
**Returns**: <code>Promise.&lt;void&gt;</code> - <ul>
<li>Void</li>
</ul>  
**Throws**:

- <ul>
<li>Throws error if any database cannot be dropped.</li>
</ul>


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [config] | <code>Object</code> |  | <p>Configuration</p> |
| [disconnect] | <code>boolean</code> | <code>true</code> | <p>If true disconnects from master database.</p> |

<a name="PgTestUtil+dropAll"></a>

### pgTestUtil.dropAll([config], [disconnect]) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Drops all items created by this instance.</p>

**Kind**: instance method of [<code>PgTestUtil</code>](#PgTestUtil)  
**Returns**: <code>Promise.&lt;void&gt;</code> - <ul>
<li>Void</li>
</ul>  
**Throws**:

- <ul>
<li>Throws error if any item cannot be dropped.</li>
</ul>


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [config] | <code>Object</code> |  | <p>Configuration</p> |
| [disconnect] | <code>boolean</code> | <code>true</code> | <p>If true disconnects from master database.</p> |

<a name="ConnectionConfig"></a>

## ConnectionConfig : <code>Object</code>
<p>Connection parameters object. Fills individual parameters from connection string or vice versa and returns
fully filled object.</p>

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| connectionString | <code>string</code> | <p>Connection string as <code>postgresql://name:pass@127.0.0.1:5432/template1</code></p> |
| database | <code>string</code> | <p>Database name</p> |
| user | <code>string</code> | <p>User name for connecting database</p> |
| password | <code>string</code> | <p>Password for user</p> |
| host | <code>string</code> | <p>Host address of database</p> |
| port | <code>number</code> | <p>Port of database</p> |

<a name="PartialConnectionConfig"></a>

## PartialConnectionConfig : <code>Object</code>
<p>Partial version of <code>ConnectionConfig</code></p>

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [connectionString] | <code>string</code> | <p>Connection string as <code>postgresql://name:pass@127.0.0.1:5432/template1</code></p> |
| [database] | <code>string</code> | <p>Database name</p> |
| [user] | <code>string</code> | <p>User name for connecting database</p> |
| [password] | <code>string</code> | <p>Password for user</p> |
| [host] | <code>string</code> | <p>Host address of database</p> |
| [port] | <code>number</code> | <p>Port of database</p> |

