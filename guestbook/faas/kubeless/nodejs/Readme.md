# Kubeless FONK Guestbook (Node.js)

This folder contains a version of the FONK Guestbook application written in Node.js using Kubeless. It is derived from [this example](https://github.com/serverless/serverless-kubeless/tree/master/examples/todo-app/backend). The steps are as follows:

* Deploying the functions
* Fixing the ingress
* Testing your API with `curl`

## Deploying the functions
In order to simplify packaging for deployment, the [Serverless Framework](http://serverless.com) is used to deploy your functions onto Kubeless.  Before proceeding, be sure to [follow the installation instructions there.](https://serverless.com/framework/docs/providers/kubeless/guide/quick-start/).

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

If you are using Cisco Container Platform 1.5, CCP provides a load balancer that can be used as an ingress.  To find its IP address:

```bash
$ kubectl get svc -n ccp
NAME                                        TYPE           CLUSTER-IP       EXTERNAL-IP    PORT(S)                      AGE
ccp-efk-kibana                              ClusterIP      10.98.44.213     <none>         5601/TCP                     7m
ccp-monitor-grafana                         ClusterIP      10.97.243.174    <none>         80/TCP                       7m
ccp-monitor-prometheus-alertmanager         ClusterIP      10.103.198.176   <none>         80/TCP                       7m
ccp-monitor-prometheus-kube-state-metrics   ClusterIP      None             <none>         80/TCP                       7m
ccp-monitor-prometheus-node-exporter        ClusterIP      None             <none>         9100/TCP                     7m
ccp-monitor-prometheus-pushgateway          ClusterIP      10.106.100.238   <none>         9091/TCP                     7m
ccp-monitor-prometheus-server               ClusterIP      10.107.22.55     <none>         80/TCP                       7m
elasticsearch-logging                       ClusterIP      10.101.248.33    <none>         9200/TCP                     7m
kubernetes-dashboard                        ClusterIP      10.107.254.199   <none>         443/TCP                      7m
nginx-ingress-controller                    LoadBalancer   10.105.21.140    10.10.20.209   80:32100/TCP,443:31192/TCP   7m
nginx-ingress-default-backend               ClusterIP      10.102.7.165     <none>         80/TCP                       7m
```
In this example, the external IP address to use is `10.10.20.209`.

Regardless of your situation, to fix this use:

```bash
kubectl edit ingress guestbook
```

This will launch a `vi` session with the configuration being used by Kubernetes to manage this ingress.  On the `host` line that lists the `*.xip.io` entry with the incorrect IP address, change it to reflect the correct IP address, which can be found in the `ingress:ip` entry at the end of the file or using the CCP load balancer external IP address.  After saving and exiting, you should now see your changes with `kubectl get ingress`.

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
