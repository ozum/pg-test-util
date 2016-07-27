'use strict';
var pg          = require('pg');
var fs          = require('fs');
var path        = require('path');
var lodash      = require('lodash');

var sql = {
    dropConnection: function(db) { return `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${db}';`; },

    dropDB: function(db) { return `DROP DATABASE IF EXISTS "${db}";`; },

    createDB: function(db, encoding, template) { return `CREATE DATABASE "${db}" WITH ENCODING = '${encoding}' TEMPLATE = "${template}";`; }

};

/**
 * Helper class and methods to use in tests using PostgreSQL database. Primary focus of this class is not speed.
 * First priority is given to do operations such as create database, drop database etc. As a result this class
 * connects to database, runs query and then simply disconnects for every query in an inefficient way to prevent
 * further tests stopped by connection or access by others errors.
 *
 * PostgreSQL needs a database name for every connection, even for creating a new database, user have to connect
 * another database. This library accepts "connectionDatabase" parameter for the name of this database for creating
 * and/or dropping databases.
 *
 * It may not best method, but it is suggested to use credentials of a PostgreSQL user which has database create
 * and drop privileges and connect to "template1" database.
 *
 * @example
 * var PgTestUtil = require('pg-test-util');
 * var pgUtil = new PgTestUtil({
 *     user             : 'user',
 *     password         : 'password',
 *     defaultDatabase  : 'db-name'
 * });
 *
 * // Using function in promises
 *
 * pgUtil.createDB('testdb', { drop: true })
 * .then(function() { return pgUtil.createDB('testdb2', { drop: true }) })
 * .then(function() { return pgUtil.dropDB('testdb') })
 * .catch(function(err) { console.log(err); });
 */
class PgTestUtil {
    /**
     * @param {Object}  [dbConfig]                                  - Configuration parameters.
     * @param {string}  [dbConfig.user=postgres]                    - User name
     * @param {string}  [dbConfig.password]                         - DB Password
     * @param {string}  [dbConfig.host=localhost]                   - Host name
     * @param {number}  [dbConfig.port=5432]                        - Port number
     * @param {string}  [dbConfig.defaultDatabase]                  - Default database name to connect fro queries if no db is given.
     * @param {string}  [dbConfig.connectionDatabase=template1]     - Database name to connect to execute createDB and dropDB functions.
     *                                                                Every connection needs a database to connect even for creating a new database.
     */
    constructor(dbConfig) {
        this.dbConfig                       = {};
        this.dbConfig.user                  = dbConfig.user     || 'postgres';
        this.dbConfig.password              = dbConfig.password;
        this.dbConfig.host                  = dbConfig.host     || 'localhost';
        this.dbConfig.port                  = dbConfig.port     || 5432;
        this.dbConfig.defaultDatabase       = dbConfig.defaultDatabase;
        this.dbConfig.connectionDatabase    = dbConfig.connectionDatabase || 'template1';
    }

    /**
     * Executes single SQL. If result is successful calls success callback, if
     * result is failure calls fail callback.
     * @param {pg.Client}   client                      - PG client object to execute SQL
     * @param {string}      sql                         - SQL query to execute
     * @returns {Promise}
     * @private
     */
    _singleSQL(client, sql) {
        return new Promise((resolve, reject) => {
            client.query(sql, function(err, result) {
                if (err) return reject(new Error(err));
                resolve(result);
            });
        });
    }

    _connect(client) {
        return new Promise((resolve, reject) => {
            client.connect((err) => {
                if (err) return reject(new Error(err));
                resolve();
            });
        });
    }

    /**
     * Connects to database, executes a single SQL query or a series of SQL queries against given databse,
     * then disconnects from it.
     * @param {string|Array.<string>}   sql     - SQL query or array of SQL queries to execute.
     * @param {string}                  [db]    - Database name to query against. Uses default value from configuration if no value is given.
     * @returns {Promise.<T>}
     */
    executeSQL(sql, db) {
        db = db || this.dbConfig.defaultDatabase;
        if (!db) throw new Error('db parameter for database name is required.');

        let client  = new pg.Client(lodash.defaults({ database: db }, this.dbConfig));

        if (typeof sql === 'string') sql = [sql]; // Convert SQL into array if it is a string.

        let promise = sql.reduce((prev, current) => {
            return prev.then(() => { return this._singleSQL(client, current); });
        }, this._connect(client));

        promise = promise
            .then((result) => {
                client.end(); return result;
            })
            .catch((err) => {
                client.end(); return Promise.reject(err);
            });

        return promise;
    }

    /**
     * Executes sql script file on a given database.
     * @param {string}  file                        - Path of the SQL file to be executed.
     * @param {string}  [db]                        - Database name. Uses default value from configuration if no value is given.
     * @param {Object}  [options]                   - Execution options.
     * @param {boolean} [options.disableTriggers]   - Disables all triggers and foreign key checks. Useful for loading backup/replicated data.
     * @returns {Promise}
     */
    executeSQLFile(file, db, options) {
        let sql = fs.readFileSync(file).toString().trim();

        if (options && options.disableTriggers) {
            sql = 'SET session_replication_role = replica;\n\n' + sql + '\n\n SET session_replication_role = DEFAULT;\n';
        }

        return this.executeSQL(sql, db);
    }

    /**
     * Creates a new db with given name from PostgreSQL template database.
     * @param {string}      db                              - Name of the database which will be created.
     * @param {Object}      [options]
     * @param {string}      [options.template=template0]    - PostgreSQL Template database to create new db from.
     * @param {string}      [options.encoding=UTF8]         - Encoding of the created database.
     * @param {boolean}     [options.drop=false]            - Drop database if exists.
     * @returns {Promise}
     */
    createDB(db, options) {
        let config      = options || {};
        let encoding    = config.encoding || 'UTF8';
        let template    = config.template || 'template0';
        let drop        = config.drop || false;
        let queries     = [];

        if (drop) {
            queries.push(sql.dropConnection(db));
            queries.push(sql.dropDB(db));
        }

        queries.push(sql.createDB(db, encoding, template));

        return this.executeSQL(queries, this.dbConfig.connectionDatabase);
    }

    /**
     * Drops given database. If there are other connected clients to this databse, also drops their connections
     * to prevent this error from PostgreSQL: database "..." is being accessed by other users.
     * @param {string}      db          - Name of the database which will be created.
     * @return {Promise}
     */
    dropDB(db) {
        let queries = [
            sql.dropConnection(db),
            sql.dropDB(db)
        ];
        return this.executeSQL(queries, this.dbConfig.connectionDatabase);
    }
}

module.exports = PgTestUtil;
