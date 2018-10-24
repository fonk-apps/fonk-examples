# Kubeless FONK Guestbook (Node.js)

This folder contains a version of the FONK Guestbook application written in Node.js using Kubeless. It is derived from [this example](https://github.com/serverless/serverless-kubeless/tree/master/examples/todo-app/backend). The steps are as follows:

* Deploying the functions
* Fixing the ingress
* Testing your API with `curl`

## Deploying the functions
In order to simplify packaging for deployment, the [Serverless Framework](http://serverless.com) is used to deploy your functions onto Kubeless.  Before proceeding, be sure to [follow the installation instructions there.](https://serverless.com/framework/docs/providers/aws/guide/quick-start/).

With the Serverless CLI installed, make sure all function dependencies are installed, including the Kubeless Serverless Plug-in, using:

```bash
npm install
```

Then deploy the functions:

```bash
$ serverless deploy
Serverless: Packaging service...
Serverless: Excluding development dependencies...
Serverless: Deploying function create...
Serverless: Deploying function list...
Serverless: Function list successfully deployed
Serverless: Function create successfully deployed
```

Validate that the functions are deployed with:

```bash
$ kubectl get pods,services
NAME                                 READY     STATUS    RESTARTS   AGE
.
.
.
po/create-66b4f5879f-vpnhq           1/1       Running   0          1m
po/list-7cbf668b55-snlql             1/1       Running   0          1m

NAME                 TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)          AGE
.
.
.
svc/create           ClusterIP      10.11.242.210   <none>          8080/TCP         1m
svc/list             ClusterIP      10.11.241.224   <none>          8080/TCP         1m

```

If you are unfamiliar with the Serverless Framework, take a look at the `serverless.yml` file.  There, the functions are defined for the two operations needed for Guestbook.  `create` uses the code in `create.js` to create new entries in the Guestbook while `list` uses the code in `list.js` to report back on the current entries.

Kubeless deploys individual functions as pods that are always running (some other FaaS runtimes that treat functions as ephemeral) and fronts them with services.

With the functions now deployed on Kubeless, they can can be invoked using the `kubeless` command line:

```bash
$ kubeless function call create --data '{"text":"Hello World"}'
{"text":"Hello World","updatedAt":1535729980939,"_id":"5b89613ce59c6876fb34767e"}

$ kubeless function call list
{"entries":[{"_id":"5b89613ce59c6876fb34767e","text":"Hello World","updatedAt":1535729980939}]}
```

But what about interacting with the functions through an API endpoint?  

## Fixing the ingress
The nginx ingress has a configuration issue on some platforms that requires inspection and correction prior to configuring the front end.  Start by inspecting the ingress:

```bash
$ kubectl get ingress
NAME        HOSTS                  ADDRESS         PORTS     AGE
guestbook   35.233.239.77.xip.io   35.233.180.47   80        2m
```
This example exhibits the configuration issue where the IP address under `HOSTS` does not match that under `ADDRESS`.  If the IP addresses match, no further configuration is required and you can skip the rest of this step.

In order to fix this, use:

```bash
kubectl edit ingress guestbook
```

This will launch a `vi` session with the configuration being used by Kubernetes to manage this ingress.  On the `host` line that lists the `*.xip.io` entry with the incorrect IP address, change it to reflect the correct IP address, which can be found in the `ingress:ip` entry at the end of the file.  After saving and exiting, you should now see:

```bash
$ kubectl get ingress
NAME        HOSTS                  ADDRESS         PORTS     AGE
guestbook   35.233.180.47.xip.io   35.233.180.47   80        6m
```
Note that you may need to repeat this step each time you deploy the functions.

## Testing your API with `curl`

The functions are now reachable with `curl`:

```bash
$ curl -d '{"text":"Hello Again"}' -H "Content-Type: application/json" -X POST http://35.233.180.47.xip.io/create
{"text":"Hello Again","updatedAt":1535730128067,"_id":"5b8961d0e59c68896034767f"}

$ curl http://35.233.180.47.xip.io/list
{"entries":[{"_id":"5b89613ce59c6876fb34767e","text":"Hello World","updatedAt":1535729980939},{"_id":"5b8961d0e59c68896034767f","text":"Hello Again","updatedAt":1535730128067}]}
```

With your API endpoints tested, [follow the instructions for configuring your front end.](../../../frontend/Readme.md)

## Proxy

You  might be behind a proxy in which case npm commands may fail.  This is because the runtime images need to have added dependencies and kubeless isn't able to get out to the internet to grab these dependencies.  If you see something like this after running ```serverless deploy```:  

```
create-857486667d-hvfqk           0/1       Init:1/2   1          14m
list-cff8b67fd-lnjfz              0/1       Init:1/2   1          14m
```

To get around this you have a few options.  

### Option 1: edit the deployment (recommended)

This is the simplist method but relies upon you having to edit the kubernetes deployment for each function created.  

By running: 

```
kubectl edit deployment list
```

search for the line that has ```npm```.  Add the proxy to this command line: 

```
> /tmp/deps.sha256 && sha256sum -c /tmp/deps.sha256 && npm config set https-proxy 
          http://proxy.esl.cisco.com:80 && npm config set registry https://registry.npmjs.org
          && npm install --production --prefix=/kubeless
```
Waiting a few minutes for the pods to grab the NPM updates will then make this pod stable. 

### Option 2: custom images

You could use a different runtime container that has the dependencies baked in.  You can modify the kubeless docker files for the runtimes by cloning the repository.  The runtime Docker images are found [here.](https://github.com/kubeless/kubeless/tree/master/docker/runtime)

You would then add your function to each of these files so it could be called.  

Then you would need to add these into the ```serverless.yaml``` configuration file: 

```
```

