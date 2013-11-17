var assert = require("assert");

// load appropriate npool module
var nPool = null;
try {
    nPool = require(__dirname + '/../build/Release/npool');
}
catch (e) {
    nPool = require(__dirname + '/../build/Debug/npool');
}

describe("[ removeFile() - Tests ]", function() {
    it("OK", function() {
        assert.notEqual(nPool, undefined);
    });
});

describe("removeFile() shall execute without throwing an exception when a valid file key provided.", function() {

    before(function() {
        nPool.loadFile(1, __dirname + '/resources/helloWorld.js');
    });

    it("Executed without throwing an exception.", function() {
        var thrownException = null;
        try {
           nPool.removeFile(1);
        }
        catch(exception) {
            thrownException = exception;
        }
        assert.equal(thrownException, null);
    });
});

describe("removeFile() shall execute without throwing an exception when passed already removed file key.", function() {

    before(function() {
        nPool.loadFile(1, __dirname + '/resources/helloWorld.js');
        nPool.removeFile(1);
    });

    it("Executed without throwing an exception.", function() {

        var thrownException = null;
        try {
           nPool.removeFile(1);
        }
        catch(exception) {
            thrownException = exception;
        }
        assert.equal(thrownException, null);
    });
});

describe("removeFile() shall throw an exception when passed an invalid argument.", function() {

    before(function() {
        nPool.loadFile(1, __dirname + '/resources/helloWorld.js');
    });

    after(function() {
        nPool.removeFile(1);
    });

    it("Exception thrown when there are no parameters.", function() {
        var thrownException = null;
        try {
            nPool.removeFile();
        }
        catch(exception) {
            thrownException = exception;
        }
        assert.notEqual(thrownException, null);
    });

    it("Exception thrown when there is more than 1 parameter.", function() {
        var thrownException = null;
        try {
            nPool.removeFile(1, 'extraParameter');
        }
        catch(exception) {
            thrownException = exception;
        }
        assert.notEqual(thrownException, null);
    });

    it("Exception thrown when the parameter is of the wrong type.", function() {
        var thrownException = null;
        try {
            nPool.removeFile([ 'invalid type' ]);
        }
        catch(exception) {
            thrownException = exception;
        }
        assert.notEqual(thrownException, null);
    });
});