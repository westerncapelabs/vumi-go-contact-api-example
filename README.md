vumi-go-contact-api-example
================

*Author:* Mike Jones [mike@westerncapelabs.com]

Minimum viable vumi-go JavaScript contacts get and set app

## Application layout

    lib/
    lib/vumi-go-contact-api-example.js
    test/test.js
    test/test-vumi-go-contact-api-example.js
    test/fixtures/
    package.json


## Understanding the contact api example application

The application is designed to demonstrate the capabilites of converting 'users'
from a session, into contacts in vumi-go which endure:

### welcome_state 

Looks up the user to see if a contact. If they are, welcomes by name and asks if want to update name.

If they are not, asks them if they are willing to set name.

### name_set

Asks for a free text first name set

### name_confirm

Sets the name, then reads back the name and asks if ok. Goes to `end_state` if yes, `name_set` if not.

### end_state

Just says thanks and goodbye 


## Test it!

    $ npm install mocha vumigo_v01 jed
    $ npm test

of if you want to have a constant test check running run the following (WARNING: config changes require this watcher restarted)

    $ ./node_modules/.bin/mocha -R spec --watch

