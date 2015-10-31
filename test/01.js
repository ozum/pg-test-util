/*jslint node: true, nomen: true */
/*global describe, it, before, beforeEach, after, afterEach */
'use strict';

var chai            = require("chai");
var chaiAsPromised  = require("chai-as-promised");
var path            = require('path');
var PgTestUtil      = require('../index');

var db              = 'pg-test-util-test-012736';
var credentials = require('./sql/credentials.js');
var pgUtil          = new PgTestUtil({ user: credentials.user, password: credentials.password, host: credentials.host, port: credentials.port, defaultDatabase: db });
var should          = chai.should();
var assert          = chai.assert;


chai.use(chaiAsPromised);

after(function() {
    return pgUtil.dropDB(db);
});

describe('Promises with functions', function () {
    it('should create and drop multiple times', function() {
        return pgUtil.createDB(db, { drop: true })
            .then(() => { return pgUtil.createDB(db, { drop: true }); })
            .then(() => { return pgUtil.dropDB(db); });
    });

    it('should create db with default values', function() {
        return pgUtil.createDB(db, { drop: false })
            .then(() => { return pgUtil.executeSQLFile('./test/sql/build-db.sql'); })
            .then(() => { return pgUtil.executeSQL("SELECT * FROM organization WHERE base_currency = 'TRY'"); })
            .then((result) => { return result.rows[0]['base_currency']; })
            .should.eventually.equal('TRY');
    });

    it('should recreate db', function() {
        return pgUtil.createDB(db, { drop: true })
            .then(() => { return pgUtil.executeSQLFile('./test/sql/build-db.sql'); })
            .then(() => { return pgUtil.executeSQL("SELECT * FROM organization WHERE base_currency = 'TRY'"); })
            .then((result) => { return result.rows[0]['base_currency']; })
            .should.eventually.equal('TRY');
    });

    it('should throw error trying to create existing db', function() {
        return pgUtil.createDB(db, { drop: true })
            .then(() => { return pgUtil.createDB(db, { drop: false }); })
            .should.be.rejectedWith('database "' + db + '" already exists');
    });
});