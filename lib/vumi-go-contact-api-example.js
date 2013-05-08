var vumigo = require("vumigo_v01");
var jed = require("jed");

if (typeof api === "undefined") {
    // testing hook (supplies api when it is not passed in by the real sandbox)
    var api = this.api = new vumigo.dummy_api.DummyApi();
    api._handle_contacts_get = function(cmd, reply) {
        //console.log('got contacts.get command', cmd.delivery_class, cmd.msisdn);
        reply({contact: im.config.test_contact_data});
    };
    api._handle_contacts_get_or_create = function(cmd, reply) {
        //console.log('got contacts.get_or_create command', cmd.delivery_class, cmd.msisdn);
        reply({success: true, contact: im.config.test_contact_data});
    };
    api._handle_contacts_update_extra = function(cmd, reply) {
        //console.log('got contacts.update_extra command', cmd.contact_key);
        reply({success: true});
    };
}

var Promise = vumigo.promise.Promise;
var success = vumigo.promise.success;
var Choice = vumigo.states.Choice;
var ChoiceState = vumigo.states.ChoiceState;
var FreeText = vumigo.states.FreeText;
var EndState = vumigo.states.EndState;
var InteractionMachine = vumigo.state_machine.InteractionMachine;
var StateCreator = vumigo.state_machine.StateCreator;

function ContactApiExampleError(msg) {
    var self = this;
    self.msg = msg;

    self.toString = function() {
        return "<ContactApiExampleError: " + self.msg + ">";
    };
}

function ContactApiExample() {
    var self = this;
    // The first state to enter
    StateCreator.call(self, 'welcome_state');

    self.add_creator('welcome_state', function(state_name, im) {
        var contact = {};
        var p = new Promise();
        p.add_callback(function(reply) {
            contact = reply.contact;
            //console.log('received contact');
        });

        api.request('contacts.get', {
            delivery_class: 'sms',
            msisdn: im.user_addr
        }, p.callback);

        var welcome_text = "";
        if (contact['name'] !== null){
            welcome_text = "Welcome " + contact['name'] + "! Would you like to update first name?";
        } else {
            welcome_text = "Welcome! Would you like to give us your first name?";
        }

        return new ChoiceState(
            state_name,
            function(choice) {
                return (choice.value == 'yes' ? 'name_set' : 'end_state');
            },
            welcome_text,
            [
                new Choice("yes", "Yes"),
                new Choice("no", "No")
            ]
            );
    });

    self.add_state(new FreeText(
        "name_set",
        "name_confirm",
        "What is your first name?"
    ));

    self.add_creator('name_confirm', function(state_name, im) {
        // go back to the first state answer
        var they_said = im.get_user_answer('name_set');
        return new ChoiceState(
            state_name,
            function(choice) {
                return (choice.value == 'yes' ? 'end_state' : 'name_set');
            },
            "Is your first name '" + they_said + "'?",
            [
                new Choice("yes", "Yes"),
                new Choice("no", "No")
            ]
            );
    });

    self.add_state(new EndState(
        "end_state",
        "Thank you and bye bye!",
        "first_state"
    ));
}

// launch app
var states = new ContactApiExample();
var im = new InteractionMachine(api, states);
im.attach();