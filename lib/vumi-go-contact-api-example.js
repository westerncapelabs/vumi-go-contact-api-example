var vumigo = require("vumigo_v01");
var jed = require("jed");

if (typeof api === "undefined") {
    var api = this.api = new vumigo.dummy_api.DummyApi();
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
        //var p = new Promise();
        var p = im.api_request('contacts.get_or_create', {
            delivery_class: 'sms',
            addr: im.user_addr
        });

        p.add_callback(function(result) {
            var welcome_text = "";
            if (result.contact['name'] !== undefined && result.contact['name'] !== null){
                welcome_text = "Welcome " + result.contact['name'] + "! Would you like to update first name?";
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
        return p;
    });

    self.add_state(new FreeText(
        "name_set",
        "name_confirm",
        "What is your first name?"
    ));

    self.add_creator('name_confirm', function(state_name, im) {
        // Save the contact
        var p = new Promise();
        api.request('contacts.get_or_create', {
            delivery_class: 'sms',
            addr: im.user_addr
        }, p.callback);

        p.add_callback(function(result) {
            return result.contact;
        });

        p.add_callback(function(contact) {
            var update_contact = new Promise();
            api.request('contacts.update', {
                key: contact.key,
                fields: {
                    name: im.get_user_answer('name_set')
                }
            }, update_contact.callback);
            return update_contact;
        });

        p.add_callback(function(update_contact) {
            if (update_contact.success){
                return new ChoiceState(
                    state_name,
                    function(choice) {
                        return (choice.value == 'yes' ? 'end_state' : 'name_set');
                    },
                    "We saved your first name as '" + im.get_user_answer('name_set') + "'. Correct?",
                    [
                        new Choice("yes", "Yes"),
                        new Choice("no", "No")
                    ]
                    );
            } else {
                return new ChoiceState(
                    state_name,
                    function(choice) {
                        return (choice.value == 'yes' ? 'end_state' : 'name_set');
                    },
                    "Could not save your first name. Try again?",
                    [
                        new Choice("yes", "Yes"),
                        new Choice("no", "No")
                    ]
                    );
            }
        });
        return p;
    });

    self.add_state(new EndState(
        "end_state",
        "Thank you and bye bye!",
        "welcome_state"
    ));
}

// launch app
var states = new ContactApiExample();
var im = new InteractionMachine(api, states);
im.attach();