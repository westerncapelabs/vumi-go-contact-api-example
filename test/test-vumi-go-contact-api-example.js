var fs = require("fs");
var assert = require("assert");
var vumigo = require("vumigo_v01");
var app = require("../lib/vumi-go-contact-api-example");

// This just checks that you hooked you InteractionMachine
// up to the api correctly and called im.attach();
describe("test_api", function() {
    it("should exist", function() {
        assert.ok(app.api);
    });
    it("should have an on_inbound_message method", function() {
        assert.ok(app.api.on_inbound_message);
    });
    it("should have an on_inbound_event method", function() {
        assert.ok(app.api.on_inbound_event);
    });
});


describe("test_api", function() {
    it("should exist", function() {
        assert.ok(app.api);
    });
    it("should have an on_inbound_message method", function() {
        assert.ok(app.api.on_inbound_message);
    });
    it("should have an on_inbound_event method", function() {
        assert.ok(app.api.on_inbound_event);
    });
});

// YOUR TESTS START HERE
// CHANGE THIS to test_your_app_name 
describe("test_vumi_go_contact_api_example", function() {

    // These are used to mock API reponses
    // EXAMPLE: Response from google maps API
    var fixtures = [];

    var tester = new vumigo.test_utils.ImTester(app.api, {
        setup: function (api) {
            api.config_store.config = JSON.stringify({});
            fixtures.forEach(function (f) {
                api.load_http_fixture(f);
            });
        },
        async: true
    });

    it("Unknown contact - welcome screen", function (done) {
        var p = tester.check_state({
            user: null,
            content: null,
            next_state: "welcome_state",
            response: "^Welcome! Would you like to give us your first name\\?[^]" +
            "1. Yes[^]" +
            "2. No$"
        });
        p.then(done, done);
    });

    it("Unknown contact - not want to update", function (done) {
        var user = {
            current_state: 'welcome_state'
        };
        var p = tester.check_state({
            user: user,
            content: "2",
            next_state: "end_state",
            response: "^Thank you and bye bye!$"
        });
        p.then(done, done);
    });

    it("Unknown contact - wants to update", function (done) {
        var user = {
            current_state: 'welcome_state'
        };
        var p = tester.check_state({
            user: user,
            content: "1",
            next_state: "name_set",
            response: "^What is your first name\\?$"
        });
        p.then(done, done);
    });

    it("Unknown contact - sets name", function (done) {
        var user = {
            current_state: 'name_set'
        };
        var p = tester.check_state({
            user: user,
            content: "Dave",
            next_state: "name_confirm",
            response: "^We saved your first name as 'Dave'. Correct\\?[^]" +
            "1. Yes[^]" +
            "2. No$"
        });
        p.then(done, done);
    });

    it("Unknown contact - name set wrong", function (done) {
        var user = {
            current_state: 'name_confirm',
            answers: {
                name_set: 'Dave'
            }
        };
        var p = tester.check_state({
            user: user,
            content: "2",
            next_state: "name_set",
            response: "^What is your first name\\?$"
        });
        p.then(done, done);
    });

    it.skip("Unknown contact - name set right", function (done) {
        var user = {
            current_state: 'name_confirm',
            answers: {
                name_set: 'Dave'
            }
        };
        var p = tester.check_state({
            user: user,
            content: "1",
            next_state: "end_state",
            response: "^Thank you and bye bye!$"
        });
        p.then(done, done);
    });

    it.skip("Known contact - welcome screen", function (done) {
        var p = tester.check_state({
            user: null,
            content: null,
            next_state: "welcome_state",
            response: "^Welcome Rodney! Would you like to update first name\\?[^]" +
            "1. Yes[^]" +
            "2. No$"
        });
        p.then(done, done);
    });

});