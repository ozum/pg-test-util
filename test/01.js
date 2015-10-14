/*jslint node: true, nomen: true */
/*global describe, it, before, beforeEach, after, afterEach */

var chai            = require("chai"),
    chaiAsPromised  = require("chai-as-promised"),
    PgTestUtil      = require('../index');

var db              = 'pg-test-util-test-01',
    pgUtil          = new PgTestUtil({ user: 'user', password: 'password', defaultDatabase: db }),
    should          = chai.should(),
    assert          = chai.assert;


chai.use(chaiAsPromised);

after(function() {
    "use strict";
    return pgUtil.dropDB(db);
});

describe('App', function () {
    "use strict";

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

