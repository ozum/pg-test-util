'use strict';

var PgTestUtil  = require('../../index');
var path        = require('path');

var db          = 'pg-test-util-test-293746';
var credentials = require('./credentials.js');
var dbOptions   = { user: credentials.user, password: credentials.password, host: credentials.host, port: credentials.port, defaultDatabase: db };
var pgUtil      = new PgTestUtil(dbOptions);

var createDB = function createDB() {
    return pgUtil.createDB(db, { drop: true })
        .then(() => { return pgUtil.executeSQLFile(path.join(__dirname, 'build-db-complex.sql')); })
        .then(() => { return pgUtil.executeSQL("SELECT * FROM information_schema.tables WHERE table_schema = 'public'"); } )
        .catch((err) => { console.log(err); } );
};

var dropDB = function dropDB() {
    return pgUtil.dropDB(db);
};

var sampleQuery = function sampleQuery() {
    return pgUtil.executeSQL("SELECT * FROM account WHERE id = 1");
};

module.exports = {
    createDB: createDB,
    dropDB: dropDB,
    sampleQuery: sampleQuery,
};
