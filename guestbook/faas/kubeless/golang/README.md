# Kubeless FONK Guestbook (Golang)

This folder contains a version fo the FONK Guestbook application written in Go 1.10 using Kubeless. 

* Deploy the functions
* Fix the proxy (if you are behind a proxy)
* Test API with `curl`

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
If your pods require a proxy configuration to access the internet to get the python dependencies see the proxy section below.  Note, that launching in golang seems to take a while since it is doing `dep ensure` and downloads dependency packages. 

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

If you are unfamiliar with the Serverless Framework, take a look at the `serverless.yml` file.  There, the functions are defined for the two operations needed for Guestbook.  Both `create` and `list` use the code in `handler.py` to create and list entries in the Guestbook.

Kubeless deploys individual functions as pods that are always running (some other FaaS runtimes that treat functions as ephemeral) and fronts them with services.

With the functions now deployed on Kubeless, they can can be invoked using the `kubeless` command line:

```bash
$ kubeless function call create --data '{"text":"Hello World"}'
{"text":"Hello World","updatedAt":1535729980939,"_id":"5b89613ce59c6876fb34767e"}

$ kubeless function call list
{"entries":[{"_id":"5b89613ce59c6876fb34767e","text":"Hello World","updatedAt":1535729980939}]}
```

## Proxy issues

If your pods require an internet proxy to get out you need to edit the deployment file.  This is done with 

By running: 

```
kubectl edit deployment list
```

search for the line that has ```dep ensure```.  Add the proxy to this command line: 

```
    - args:
        - echo '144493f7cb03633804450b6eee3a40b30e0dd6b827986244070aa21129df97f0  /kubeless/Gopkg.toml'
          > /tmp/deps.sha256 && sha256sum -c /tmp/deps.sha256 && cd $GOPATH/src/kubeless
          && https_proxy=proxy.esl.cisco.com:80 dep ensure > /dev/termination-log
          2>&1
```

There is an open [issue with Kubeless](https://github.com/kubeless/kubeless/issues/931#issuecomment-433242459) on this. 

Unfortunately you have to do this anytime you do a `serverless deploy`. 
 

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

Another option to fix this would be to add the `hostname` in the `serverless.yaml` file.  By adding: 

```
provider:
  name: kubeless
  hostname: 35.233.180.47.xip.io
```
You can ensure it uses the correct ingress service in the ingress rule. 


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


This is the simplist method but relies upon you having to edit the kubernetes deployment for each function created.  



```
- args:
        - echo 'a835951ae9bbd47f0b7304dbe44f576b42ac21b29a81f41d665c5f707b8a2200  /kubeless/requirements.txt'
          > /tmp/deps.sha256 && sha256sum -c /tmp/deps.sha256 && https_proxy=proxy.esl.cisco.com:80
          pip install --prefix=/kubeless -r /kubeless/requirements.txt
```
Waiting a few minutes for the pods to grab the pip  updates will then make this pod stable and finish. 

## Development process cheatsheet

```
serverless deploy -f list -v
serverless invoke -f list -l
serverless logs -f list
```

```
kubeless function ls
```
