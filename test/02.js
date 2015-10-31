'use strict';
var testDB          = require('./sql/util');
var chai            = require("chai");
var chaiAsPromised  = require("chai-as-promised");

chai.use(chaiAsPromised);

var should          = chai.should();

before((done) => {
    testDB.createDB()
        .then(() => { done(); })
        .catch((err) => { console.log(err); done(); } );
});

describe('Before-After', function() {
    it('should work', function() {
        return testDB.sampleQuery()
            .then((result) => { return result.rows[0].name ; } )
            .should.eventually.equal('Fortibase');
    })
});

after((done) => {
    testDB.dropDB().then(() => {
        done();
    });
});