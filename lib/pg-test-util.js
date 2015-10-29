"use strict";
var optional    = require('optional'),
    pgNative    = optional('pg-native'),
    pg          = pgNative ? require('pg').native : require('pg'),
    fs          = require('fs'),
    path        = require('path'),
    lodash      = require('lodash');

//pg.on('error', function (err) {
//    // Do nothing on termination due to admin command. We do this to drop previously created test db.
//    if (!err.message.match('terminating connection due to administrator command')) { console.log('Database error: ', err); }
//});

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
 *
 * // Using binded functions in promises
 *
 * pgUtil.createDB('testdb', { drop: true })
 * .then(pgUtil.createDB.bind(pgUtil, 'testdb2', { drop: true }))
 * .then(pgUtil.dropDB.bind(pgUtil, 'deneme'))
 * .catch(function(err) { console.log(err); });
 */
class PgTestUtil {
    /**
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
            //console.log("Executing SQL: " + sql);
            client.query(sql, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
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
        if (!db) {
            throw new Error('db parameter for database name is required.');
        }

        let    client  = new pg.Client(lodash.defaults({ database: db }, this.dbConfig)),
            pro     = [];

        // Convert SQL into array if it is a string.
        if (typeof sql === 'string') {
            sql = [sql];
        }

        // Create a promise for connecting client.
        pro[0] = new Promise((resolve, reject) => {
            client.connect(function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        // Execute given SQL queries by adding then blocks.
        for (let i = 0; i < sql.length; i = i + 1) {
            pro[i+1] = pro[i].then( () => { return this._singleSQL(client, sql[i], db) });
        }

        // Disconnect client in a final then block;
        pro[pro.length] = pro[pro.length-1].then((result) => { client.end(); return result; });

        // Add a catch block to capture exceptions, cleanly disconnect and return error object as rejected.
        return pro[pro.length-1].catch((err) => {
            client.end();
            return Promise.reject(err);
        });
    }

    /**
     * Executes sql script file on a given database.
     * @param {string} file     - Path of the SQL file to be executed.
     * @param {string} [db]     - Database name. Uses default value from configuration if no value is given.
     * @returns {Promise}
     */
    executeSQLFile(file, db) {
        let sql = fs.readFileSync(file).toString().trim();
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
        let config      = options || {},
            encoding    = config.encoding || 'UTF8',
            template    = config.template || 'template0',
            drop        = config.drop || false,
            sql = `CREATE DATABASE "${db}" WITH ENCODING = '${encoding}' TEMPLATE = "${template}";`;

        if (drop) {
            return this.dropDB(db)
                .then( () => { return this.executeSQL(sql, this.dbConfig.connectionDatabase); } );

        } else {
            return this.executeSQL(sql, this.dbConfig.connectionDatabase);
        }
    }


    /**
     * Drops given database. If there are other connected clients to this databse, also drops their connections
     * to prevent this error from PostgreSQL: database "..." is being accessed by other users.
     * @param {string}      db          - Name of the database which will be created.
     * @return {Promise}
     */
    dropDB(db) {
        let sql = [
            `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${db}';`,
            `DROP DATABASE IF EXISTS "${db}";`
        ];
        return this.executeSQL(sql, this.dbConfig.connectionDatabase);
    }
}

module.exports = PgTestUtil;

