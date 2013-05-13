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


describe("Using the vumi-go contact api", function() {

    describe("an unknown contact", function() {

        // These are used to mock API reponses
        // EXAMPLE: Response from google maps API
        var fixtures = [];

        var tester = new vumigo.test_utils.ImTester(app.api, {
            custom_setup: function (api) {
                api.config_store.config = JSON.stringify({});
                fixtures.forEach(function (f) {
                    api.load_http_fixture(f);
                });
                api._dummy_contacts = {};
                api._handle_contacts_get_or_create = function(cmd, reply) {
                    reply({
                        success: true,
                        created: false,
                        contact: {
                            key: 'contact-key'
                        }
                    });
                };

                api._handle_contacts_update = function(cmd, reply) {
                    api._dummy_contacts[cmd.key] = cmd.fields;
                    api._dummy_contacts[cmd.key]['extras'] = {};
                    reply({success: true});
                };

                api._handle_contacts_update_extra = function(cmd, reply) {
                    api._dummy_contacts[cmd.contact_key]['extras'][cmd.field] = cmd.value;
                    reply({success: true});
                };
            },
            async: true
        });

        it("sees a welcome screen", function (done) {
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

        it("does not want to update so is thanked", function (done) {
            var user = {
                current_state: 'welcome_state'
            };
            var p = tester.check_state({
                user: user,
                content: "2",
                next_state: "end_state",
                response: "^Thank you and bye bye!$",
                continue_session: false
            });
            p.then(done, done);
        });

        it("wants to do an update so is asked for name", function (done) {
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

        it("reviews their name being saved", function (done) {
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

        it("got the wrong name so tries to reset", function (done) {
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

        it("confirms we got their name set right", function (done) {
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
                response: "^Thank you and bye bye!$",
                continue_session: false
            });
            p.then(done, done);
        });

    });

    describe("a known contact", function() {
        var fixtures = [];

        var tester = new vumigo.test_utils.ImTester(app.api, {
            custom_setup: function (api) {
                api.config_store.config = JSON.stringify({});
                fixtures.forEach(function (f) {
                    api.load_http_fixture(f);
                });
                api._dummy_contacts = {
                    key: "f953710a2472447591bd59e906dc2c26",
                    surname: "Trotter",
                    user_account: "test-0-user",
                    bbm_pin: null,
                    msisdn: "1234567",
                    created_at: "2013-04-24 14:01:41.803693",
                    gtalk_id: null,
                    dob: null,
                    groups: ["group-a", "group-b"],
                    facebook_id: null,
                    twitter_handle: null,
                    email_address: null,
                    name: "Rodney"
                };
                api._handle_contacts_get_or_create = function(cmd, reply) {
                    reply({
                        success: true,
                        created: false,
                        contact: api._dummy_contacts
                    });
                };

                api._handle_contacts_update = function(cmd, reply) {
                    api._dummy_contacts[cmd.key] = cmd.fields;
                    api._dummy_contacts[cmd.key]['extras'] = {};
                    reply({success: true});
                };

                api._handle_contacts_update_extra = function(cmd, reply) {
                    api._dummy_contacts[cmd.contact_key]['extras'][cmd.field] = cmd.value;
                    reply({success: true});
                };
            },
            async: true
        });
        it("sees a customised welcome screen", function (done) {
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

});