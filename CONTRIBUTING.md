# Contributing to FONK
Welcome to the FONK Contribution Guide, which is organized as follows:

* I just have a question
* I want to report a bug
* I want to build a new example of an existing application
* I want to build a new application

## I just have a question
Don't submit an issue for questions, [catch us on Slack](https://join.slack.com/t/fonk-apps/shared_invite/enQtNDEwNTc4NDI0OTMzLTNhZjA3MTE1NTdjMjY3MWJkM2MwNGViNGJlNWVhNGFlNDZjOWExMzViNzkyMTcyMjA3YmU4MmYwNGEyZGVlODA) instead.

## I want to report a bug
Feel free to submit an issue, but be sure to be descriptive about what is happening vs what you expect to happen and include the K8S provider you are trying to use as well as tags for the application, FaaS runtime, and language so that the right people see it.

## I want to build a new example of an existing application
### Calling "dibs" on application/FaaS runtime/language combinations
Each application/FaaS runtime/language combination being currently worked on by someone has an issue created for it.  Don't see the combination you'd like to work on?  Create an issue and put in the comments that you are working on it.  

Need to stop?  Add another comment.

See a combination that someone has said they are working on but it hasn't been updated in awhile?  Add a comment to see if it is still actively being worked on and if it gets ignored for a few days go for it.

### Technical stuff you should know first
Before contributing an example, there are a few things you should be aware of before you get started:

* **Packaged Libraries** - Not all languages supported by the FaaS runtimes enable a developer to package libraries along with a function.  In order to connect to the MongoDB, this can prove problematic for interpreted languages.  Before starting a particular application/FaaS runtime/language combination, be sure that if the language requires library packaging that the FaaS runtime supports it.
* **Walking before you can run** - Start with simply confirming that parameters can be passed to a function in the FaaS runtime/language combination in question from the command line and that logging can be viewed.  Then move on to the database calls and being able to call the functions from `curl`.  Then tackle . . .
* **CORS** - It is common for an API to work beautifully when accessed by `curl` only to have it break down in a browser over `CORS`.  The examples provided by FONK explain how to work around this for FaaS runtimes that don't provide API gateways that deal with it permanently.
* **Certificates** - For OpenWhisk in particular, the API gateway requires HTTPS but the default binaries ship with self-signed certificates.  The examples provided by FONK explain how to work around this for learning purposes but if leveraging FONK for production, be sure to check the OpenWhisk documentation for remedying this permanently.
* **Single, Simple Front Ends** - By default each application/FaaS runtime/language combination of should use the same front end but with differing back end.  To keep the learning curve low, there is a strong preference to use simple HTML5/CSS/Bootstrap front ends.

## I want to build a new application
Feel free to propose something [on the Slack channel](https://join.slack.com/t/fonk-apps/shared_invite/enQtNDEwNTc4NDI0OTMzLTNhZjA3MTE1NTdjMjY3MWJkM2MwNGViNGJlNWVhNGFlNDZjOWExMzViNzkyMTcyMjA3YmU4MmYwNGEyZGVlODA).
