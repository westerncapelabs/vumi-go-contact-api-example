var fs = require("fs");
var assert = require("assert");
var app = require("../lib/vumi-go-contact-api-example");


function fresh_api() {
    var api = app.api;
    api.reset();
    reset_im(api.im);
    return api;
}

function reset_im(im) {
    im.user = null;
    im.i18n = null;
    im.i18n_lang = null;
    im.current_state = null;
}

function maybe_call(f, that, args) {
    if (typeof f != "undefined" && f !== null) {
        f.apply(that, args);
    }
}

function check_state(user, content, next_state, expected_response, setup,
                     teardown) {
    // setup api
    var api = fresh_api();
    var from_addr = "+27831234567";
    var user_key = "users." + from_addr;
    api.kv_store[user_key] = user;

    maybe_call(setup, this, [api]);

    api.add_reply({
        cmd: "outbound.reply_to"
    });

    // send message
    api.on_inbound_message({
        cmd: "inbound-message",
        msg: {
            from_addr: from_addr,
            content: content,
            message_id: "123"
        }
    });

    // check result
    var saved_user = api.kv_store[user_key];
    assert.equal(saved_user.current_state, next_state);
    var reply = api.request_calls.shift();
    var response = reply.content;
    try {
        assert.ok(response);
        assert.ok(response.match(expected_response));
        assert.ok(response.length <= 163);
    } catch (e) {
        console.log(api.logs);
        console.log(response);
        console.log(expected_response);
        if (typeof response != 'undefined')
            console.log("Content length: " + response.length);
        throw e;
    }
    assert.deepEqual(app.api.request_calls, []);
    assert.equal(app.api.done_calls, 1);

    maybe_call(teardown, this, [api, saved_user]);
}

function CustomTester(custom_setup, custom_teardown) {
    var self = this;

    self._combine_setup = function(custom_setup, orig_setup) {
        var combined_setup = function (api) {
            maybe_call(custom_setup, self, [api]);
            maybe_call(orig_setup, this, [api]);
        };
        return combined_setup;
    };

    self._combine_teardown = function(custom_teardown, orig_teardown) {
        var combined_teardown = function (api, saved_user) {
            maybe_call(custom_teardown, self, [api, saved_user]);
            maybe_call(orig_teardown, this, [api, saved_user]);
        };
        return combined_teardown;
    };

    self.check_state = function(user, content, next_state, expected_response,
                                setup, teardown) {
        return check_state(user, content, next_state, expected_response,
                           self._combine_setup(custom_setup, setup),
                           self._combine_teardown(custom_teardown, teardown));
    };

    self.check_close = function(user, next_state, setup, teardown) {
        return check_close(user, next_state,
                           self._combine_setup(custom_setup, setup),
                           self._combine_teardown(custom_teardown, teardown));
    };
}

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
    var fixtures = [
       //'test/fixtures/contact.json'
    ];

    var tester = new CustomTester(function (api) {
        api.config_store.config = JSON.stringify({
            //test_contact_data: JSON.parse(fs.readFileSync("test/fixtures/contact.json"))
        });
        fixtures.forEach(function (f) {
            api.load_http_fixture(f);
        });
    });

    // first test should always start 'null, null' because we haven't started interacting yet
    it("Unknown contact - welcome screen", function () {
        tester.check_state(null, null, "welcome_state",
            "^Welcome! Would you like to give us your first name\\?[^]" +
            "1. Yes[^]" +
            "2. No$"
            );
    });

    it("Unknown contact - not want to update", function () {
        var user = {
            current_state: 'welcome_state'
        };
        tester.check_state(
            user,
            "2",
            "end_state",
            "^Thank you and bye bye!$"
            );
    });

    it("Unknown contact - wants to update", function () {
        var user = {
            current_state: 'welcome_state'
        };
        tester.check_state(
            user,
            "1",
            "name_set",
            "^What is your first name\\?$"
            );
    });

    it("Unknown contact - sets name", function () {
        var user = {
            current_state: 'name_set'
        };
        tester.check_state(
            user,
            "Dave",
            "name_confirm",
            "^We saved your first name as 'Dave'. Correct\\?[^]" +
            "1. Yes[^]" +
            "2. No$"
            );
    });

    it("Unknown contact - name set wrong", function () {
        var user = {
            current_state: 'name_confirm',
            answers: {
                name_set: 'Dave'
            }
        };
        tester.check_state(
            user,
            "2",
            "name_set",
            "^What is your first name\\?$"
            );
    });

    it("Unknown contact - name set right", function () {
        var user = {
            current_state: 'name_confirm',
            answers: {
                name_set: 'Dave'
            }
        };
        tester.check_state(
            user,
            "1",
            "end_state",
            "^Thank you and bye bye!$"
            );
    });

    it.skip("Known contact - welcome screen", function () {
        tester.check_state(null, null, "welcome_state",
            "^Welcome Rodney! Would you like to update first name\\?[^]" +
            "1. Yes[^]" +
            "2. No$"
            );
    });

});