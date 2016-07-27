<a name="PgTestUtil"></a>

## PgTestUtil
Helper class and methods to use in tests using PostgreSQL database. Primary focus of this class is not speed.
First priority is given to do operations such as create database, drop database etc. As a result this class
connects to database, runs query and then simply disconnects for every query in an inefficient way to prevent
further tests stopped by connection or access by others errors.

PostgreSQL needs a database name for every connection, even for creating a new database, user have to connect
another database. This library accepts "connectionDatabase" parameter for the name of this database for creating
and/or dropping databases.

It may not best method, but it is suggested to use credentials of a PostgreSQL user which has database create
and drop privileges and connect to "template1" database.

**Kind**: global class  

* [PgTestUtil](#PgTestUtil)
    * [new PgTestUtil([dbConfig])](#new_PgTestUtil_new)
    * [.executeSQL(sql, [db])](#PgTestUtil+executeSQL) ⇒ <code>Promise.&lt;T&gt;</code>
    * [.executeSQLFile(file, [db], [options])](#PgTestUtil+executeSQLFile) ⇒ <code>Promise</code>
    * [.createDB(db, [options])](#PgTestUtil+createDB) ⇒ <code>Promise</code>
    * [.dropDB(db)](#PgTestUtil+dropDB) ⇒ <code>Promise</code>

<a name="new_PgTestUtil_new"></a>

### new PgTestUtil([dbConfig])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [dbConfig] | <code>Object</code> |  | Configuration parameters. |
| [dbConfig.user] | <code>string</code> | <code>&quot;postgres&quot;</code> | User name |
| [dbConfig.password] | <code>string</code> |  | DB Password |
| [dbConfig.host] | <code>string</code> | <code>&quot;localhost&quot;</code> | Host name |
| [dbConfig.port] | <code>number</code> | <code>5432</code> | Port number |
| [dbConfig.defaultDatabase] | <code>string</code> |  | Default database name to connect fro queries if no db is given. |
| [dbConfig.connectionDatabase] | <code>string</code> | <code>&quot;template1&quot;</code> | Database name to connect to execute createDB and dropDB functions.                                                                Every connection needs a database to connect even for creating a new database. |

**Example**  
```js
var PgTestUtil = require('pg-test-util');
var pgUtil = new PgTestUtil({
    user             : 'user',
    password         : 'password',
    defaultDatabase  : 'db-name'
});

// Using function in promises

pgUtil.createDB('testdb', { drop: true })
.then(function() { return pgUtil.createDB('testdb2', { drop: true }) })
.then(function() { return pgUtil.dropDB('testdb') })
.catch(function(err) { console.log(err); });
```
<a name="PgTestUtil+executeSQL"></a>

### pgTestUtil.executeSQL(sql, [db]) ⇒ <code>Promise.&lt;T&gt;</code>
Connects to database, executes a single SQL query or a series of SQL queries against given databse,
then disconnects from it.

**Kind**: instance method of <code>[PgTestUtil](#PgTestUtil)</code>  

| Param | Type | Description |
| --- | --- | --- |
| sql | <code>string</code> &#124; <code>Array.&lt;string&gt;</code> | SQL query or array of SQL queries to execute. |
| [db] | <code>string</code> | Database name to query against. Uses default value from configuration if no value is given. |

<a name="PgTestUtil+executeSQLFile"></a>

### pgTestUtil.executeSQLFile(file, [db], [options]) ⇒ <code>Promise</code>
Executes sql script file on a given database.

**Kind**: instance method of <code>[PgTestUtil](#PgTestUtil)</code>  

| Param | Type | Description |
| --- | --- | --- |
| file | <code>string</code> | Path of the SQL file to be executed. |
| [db] | <code>string</code> | Database name. Uses default value from configuration if no value is given. |
| [options] | <code>Object</code> | Execution options. |
| [options.disableTriggers] | <code>boolean</code> | Disables all triggers and foreign key checks. Useful for loading backup/replicated data. |

<a name="PgTestUtil+createDB"></a>

### pgTestUtil.createDB(db, [options]) ⇒ <code>Promise</code>
Creates a new db with given name from PostgreSQL template database.

**Kind**: instance method of <code>[PgTestUtil](#PgTestUtil)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| db | <code>string</code> |  | Name of the database which will be created. |
| [options] | <code>Object</code> |  |  |
| [options.template] | <code>string</code> | <code>&quot;template0&quot;</code> | PostgreSQL Template database to create new db from. |
| [options.encoding] | <code>string</code> | <code>&quot;UTF8&quot;</code> | Encoding of the created database. |
| [options.drop] | <code>boolean</code> | <code>false</code> | Drop database if exists. |

<a name="PgTestUtil+dropDB"></a>

### pgTestUtil.dropDB(db) ⇒ <code>Promise</code>
Drops given database. If there are other connected clients to this databse, also drops their connections
to prevent this error from PostgreSQL: database "..." is being accessed by other users.

**Kind**: instance method of <code>[PgTestUtil](#PgTestUtil)</code>  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>string</code> | Name of the database which will be created. |


---------------------------------------

History & Notes
================
#### 1.3.3 / 2016-06-27
* Fixed: `optional` dependency removed.

#### 1.3.0 / 2016-06-06
* Added: `options` parameter added to `executeSQLFile` method.
* Added: SQL files can be executed all triggers and foreign key constraints disabled. (disableTriggers option)

#### 1.2.0 / 2015-09-21
* connectionDatabase parameter added to constructor for an additional database to connect while creating and dropping
databases.

#### 1.1.0 / 2015-09-17
* pg-native support added. (Optional)

#### 1.0.0 / 2015-09-16
* Initial version

LICENSE
=======

The MIT License (MIT)

Copyright (c) 2015 Özüm Eldoğan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.