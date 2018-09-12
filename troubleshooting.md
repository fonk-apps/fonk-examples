# Troubleshooting
While serverless programming typically requires less code, that often comes at the cost of less visibility into the execution of that code.  This page describes some troubleshooting tips for each FaaS runtime that can help as you create new functions.

## Troubleshooting OpenWhisk functions
Every time a function executes on OpenWhisk, it creates what OpenWhisk calls an `activation record`.  The `wsk` CLI has a command that can list these records:

```bash
$ wsk activation list -i
activations
91a4008d07c241f7a4008d07c2d1f727 list                
88661ee28df64b4fa61ee28df6ab4fe9 list                
a31db224b4c448069db224b4c4b8067f list                
6cae54737b994ea7ae54737b99aea7a3 create              
1e1bcbe4d1db4e999bcbe4d1dbfe995a greeting            
6c9e0c4f8b364bec9e0c4f8b36dbecec greeting            
3bf2bb5af8574949b2bb5af85739493a greeting            
4fb7cb304b994a3db7cb304b994a3da6 greeting            
51ddf357f87748719df357f877c87140 greeting            
492dc252c8f9404aadc252c8f9004a68 greeting
```
and view the contents of an individual record:
```bash
$ wsk activation logs 91a4008d07c241f7a4008d07c2d1f727 -i
2018-08-16T15:04:28.215869463Z stdout: About to connect to:mongodb://fonkdb-mongodb.default:27017/guestbook_app
```
When a function writes to `stdout` or `stderr`, the results show up here in the activation record.  The example above came from the development of the Node.js Guestbook for OpenWhisk and shows a since removed `console.log()` of the MongoDB connection URL.  Note that it sometimes takes a few minutes after the invocation of a function in order for its activation record to show up in the list.

## Troubleshooting OpenFaaS functions
The [OpenFaaS Troubleshooting Guide](https://docs.openfaas.com/deployment/troubleshooting) provides many steps for interrogating an instance of OpenFaaS, including [obtaining log data from function executions](https://docs.openfaas.com/deployment/troubleshooting/#function-execution-logs).

## Troubleshooting Kubeless functions
The [Kubeless Debugging Guide](https://kubeless.io/docs/debug-functions/) offers a variety of tips for how to figure out what is going on inside functions.

## Troubleshooting Fission functions
Digging through the Fission CLI help system reveals how to inspect logs from a function invocation, but for convienence here is the command:
```bash
 fission fn logs --name <function name>
 ```
 Keep in mind that there can be a delay between function invocation time and the log data becoming available.
