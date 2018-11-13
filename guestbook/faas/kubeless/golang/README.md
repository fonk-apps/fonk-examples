# Kubeless FONK Guestbook (Golang)

This folder contains a version fo the FONK Guestbook application written in Go 1.10 using Kubeless.

* Update to a CORS enabled runtime
* Deploy the functions
* Proxy issues
* Fixing the ingress
* Test API with `curl`

## Update to a CORS enabled runtime

Kubeless doesn't support [cors](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) in golang quite yet, but we have submitted a [PR](https://github.com/kubeless/kubeless/issues/934) to get this taken care of.  To make it work now, you just need to do a quick configuration change as is documented [in the kubeless documentation](https://kubeless.io/docs/runtimes/) on custom runtimes.

```
kubectl edit -n kubeless configmap kubeless-config
```

Find the `go1.10` line and replace the images used with some fixed images:

```diff
- "initImage: kubeless/go-init@sha256:983b3f06452321a2299588966817e724d1a9c24be76cf1b12c14843efcdff502",
+ "initImage": "vallard/kubelessgo-init:1.10",
```

Kill the existing controller so it re-reads the configMap.  (Don't worry, all existing pods will still run and the pod will restart)

```
kubectl delete pods -n kubeless -l kubeless=controller
```

Now you have a cors enabled golang runtime!


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
If your pods require a proxy configuration to access the internet to get the Golang Deps see the proxy section below.   

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

If you are unfamiliar with the Serverless Framework, take a look at the `serverless.yml` file.  There, the functions are defined for the two operations needed for Guestbook.  Both `create` and `list` use the code in `guestbook.go` to create and list entries in the Guestbook.

Kubeless deploys individual functions as pods that are always running (some other FaaS runtimes that treat functions as ephemeral) and fronts them with services.

With the functions now deployed on Kubeless, they can can be invoked using the `kubeless` command line:

```bash
$ kubeless function call create --data '{"text":"Hello World"}'
{"text":"Hello World","updatedAt":1535729980939,"_id":"5b89613ce59c6876fb34767e"}

$ kubeless function call list
{"entries":[{"_id":"5b89613ce59c6876fb34767e","text":"Hello World","updatedAt":1535729980939}]}
```

## Proxy issues

If you are running behind a firewall, see [Using Kubeless behind a firewall](../../../../kubeless-firewall.md).

## Fixing the ingress

See [Fixing Kubeless Ingress Issues](../../../../kubeless-ingress.md).

## Testing your API with `curl`

The functions are now reachable with `curl`:

```bash
$ curl -d '{"text":"Hello Again"}' -H "Content-Type: application/json" -X POST http://35.233.180.47.xip.io/create
{"text":"Hello Again","updatedAt":1535730128067,"_id":"5b8961d0e59c68896034767f"}

$ curl http://35.233.180.47.xip.io/list
{"entries":[{"_id":"5b89613ce59c6876fb34767e","text":"Hello World","updatedAt":1535729980939},{"_id":"5b8961d0e59c68896034767f","text":"Hello Again","updatedAt":1535730128067}]}
```

With your API endpoints tested, [follow the instructions for configuring your front end.](../../../frontend/Readme.md)
