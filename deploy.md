# Deploying FONK components
Before you get started with one of the examples, you'll need to set up the right FONK components.  To get you started, we recommend using [Minio](https://www.minio.io/) as your object storage, [MongoDB](https://www.mongodb.com/) as your NoSQL server, and you get to choose among [Fission.io](https://fission.io/), [OpenFaaS](https://www.openfaas.com/), [Kubeless](https://kubeless.io/), and [OpenWhisk](https://openwhisk.apache.org/) for your FaaS runtime.

* Obtaining a Kubernetes Cluster
* Deploying Minio
* Deploying MongoDB
* Deploying a FaaS Runtime
* Troubleshooting

Most, but not all, components offer Helm installers once you get your Kubernertes cluster set up.  [If you are new to Helm, start here.](../../helm.md)

## Obtaining a Kubernetes Cluster
The `K` in FONK stands for Kubernetes (cool kid acronym: *k8s*) and it's the platform used to schedule all other components.  You have a number of choices for k8s clusters that can run FONK examples:

* Minikube - Where most people start to run a small k8s cluster on a laptop.  However, some FaaS runtimes have CPU and memory usage that makes deploying them on a laptop a less than optimal experience.  As such, we do not recommend using Minikube for FONK examples.
* [Cisco Container Platform](https://devnetsandbox.cisco.com/RM/Diagram/Index/f8dbda33-0c6e-4c4d-9fea-73e4451d730c?diagramType=Topology) - DevNet, [Cisco's developer relations team](https://developer.cisco.com), offers a free 6 hour trial sandbox (extendable to a full week) of Cisco's on prem k8s solution.
* [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine/docs/quickstart) - Google's managed Kubernetes service, usage costs apply.
* [Amazon Elastic Container Service for Kubernetes (EKS)](https://docs.aws.amazon.com/eks/latest/userguide/getting-started.html) - Amazon's managed Kubernetes service, usage costs apply.
* [Azure Kubernetes Service (AKS)](https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough) - Azure's managed Kubernetes service, usage costs apply.

## Deploying Minio

Per [the Minio Helm chart](https://github.com/helm/charts/tree/master/stable/minio), two configuration parameters will be passed into the `helm install` command.  Specifically, for simplicity it will skip persisting any volumes behind the database (which you would never do in "real life") and use a `LoadBalancer` service, so you can use either the Minio UI or CLI from outside the cluster more easily.

To execute it:
```bash
$ helm install stable/minio --name fonkfe --set service.type=LoadBalancer,persistence.enabled=false
```

The result should be something similar to:

```bash
$ kubectl get pods,services
NAME                                        READY     STATUS    RESTARTS   AGE
po/fonk-minio-f94dd5d4c-vjr4g     1/1       Running   0          17m

NAME                        TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
svc/fonk-minio   LoadBalancer   10.7.255.16    35.197.4.15   9000:31716/TCP   56s
```
Make note of the `EXTERNAL-IP` as it will be used later.

## Deploying MongoDB
Per [the MongoDB Helm chart](https://github.com/helm/charts/tree/master/stable/mongodb), two configuration parameters will be passed into the `helm install` command.  Specifically, for simplicity it will skip persisting any volumes behind the database and adding any passwords (neither of which you would never do in "real life").

To execute it:
```bash
$ helm install stable/mongodb --name fonkdb --set service.type=LoadBalancer,persistence.enabled=false,usePassword=false
```
The result should be something similar to:

```bash
$ kubectl get pods,services
NAME                                READY     STATUS    RESTARTS   AGE
po/fonkdb-mongodb-dc85f5b46-96f86   1/1       Running   0          54s

NAME                 TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)     AGE
svc/fonkdb-mongodb   ClusterIP   10.96.66.67   <none>        27017/TCP   54s
```
Now, it may seem unusual to have `service.type=LoadBalancer` as an option there, but it turns out that functions executing in OpenWhisk have not context that they are running within k8s and typical k8s resource references like `fonkdb-mongodb.default` within them do not work.  Instead, they must be referenced as if external to the k8s cluster, hence the `LoadBalancer` setting to make this possible.

If you need to start over with MogoDB, you can purge it with:

```bash
$ helm delete --purge fonkdb
```
This will enable you to deploy it fresh again.

## Deploying a FaaS Runtime
In FONK, JavaScript gets loaded into a browser off of the object store, which then calls a REST API housed by a FaaS runtime.  Individual functions in that REST API perform CRUDL operations against the NoSQL database, and snap, the job's a game.  Because function signatures, and various other details, vary among the different FaaS runtimes, each example has FaaS runtime-specific CRUDL operations.

Before the example code can be loaded into one of the FaaS runtimes, the chosen runtime has to be deployed on k8s, but only one has to be chosen to run each example.  This section provides pointers to installation instructions with each FaaS runtime and offers tips where appropriate.

### Deploying OpenFaaS
To deploy OpenFaaS on k8s, the [Helm chart instructions can be found on their faas-netes project](https://github.com/openfaas/faas-netes/blob/master/chart/openfaas/README.md).  Specifically, follow the "Deploy OpenFaaS" instructions, but other sections on that page are for advanced usage.

On some k8s clusters, the `helm repo add openfaas https://openfaas.github.io/faas-netes/` will fail with a certificate error.  When that happens, you'll need to install from the `faas-netes` repo directly with:

```bash
kubectl apply -f https://raw.githubusercontent.com/openfaas/faas-netes/master/namespaces.yml
git pull https://github.com/openfaas/faas-netes.git
cd faas-netes/chart/openfaas
helm install . --namespace openfaas --set functionNamespace=openfaas-fn
```

Separately, you'll need the [OpenFaaS CLI](https://github.com/openfaas/faas-cli), the "Get started: Install the CLI" section.

A good way to confirm the installation is to [go through this Node.js tutorial](https://docs.openfaas.com/tutorials/cli-with-node/), which within the `callme.yml` file will need the IP address of your cluster and port for your `gateway` (most likely 31112) in addition to changing the `image` entry to reflect your username/imagename for your image repo.  Note that you'll need a local Docker install in order to work through any OpenFaaS examples.

### Deploying Fission.io
The [Fission.io install guide](https://docs.fission.io/0.8.0/installation/installation/) not only has a simple Helm command for installing the runtime on k8s, but it also has instructions for installing the CLI and then walks you through some simple examples.

### Deploying Kubeless
The [Kubeless QuickStart](https://kubeless.io/docs/quick-start/) provides instructions for deploying the runtime, the CLI, and a sample function all in one place.  Keep in mind  there is a distinction between installing Kubeless on non-RBAC clusters (typically minikube) and RBAC clusters (typically everything else) and that some times vendor specific steps apply ([GKE](https://kubeless.io/docs/GKE-deployment/), [AKS](https://kubeless.io/docs/kubeless-on-azure-container-services/))

A default Kubeless deployment will not contain an ingress, which will be required in order for the front end to communicate with the functions.  Therefore, after completing the base Kubeless deployment, [deploy nginx as an ingress](https://github.com/kubernetes/ingress-nginx/blob/master/docs/deploy/index.md) as well.

### Deploying OpenWhisk
The [OpenWhisk Helm instructions](https://github.com/apache/incubator-openwhisk-deploy-kube) have some k8s vendor-specific steps to them.  They require you to clone the repo before using the Helm chart supplies.  Generally speaking, once you've initialized Helm in your cluster, creating the *mycluster.yml* file the instructions suggest with the IP address of the master node and port `31001` will suffice.

The `wsk` CLI for OpenWhisk has [downloadable binaries for most platforms](https://github.com/apache/incubator-openwhisk-cli/releases).  When you deploy OpenWhisk via Helm, you'll get a broadcast message telling you how to configure `wsk` for your newly installed instance, but this typically works:

```bash
wsk property set --apihost <your cluster master IP>:31001
wsk property set --auth 23bc46b1-71f6-4ed5-8c54-816aa4f8c502:123zO3xZCLrMN6v2BKK1dXYFpXlPkccOFqm12CdAsMgRU4VrNZ9lyGVCGuMDGIwP
```

Depending upon your cluster, the OpenWhisk install can take roughly up to 10-15 minutes to come up correctly, so be patient and monitor its progress with `kubectl get pods -n openwhisk`.

Keep in mind that the default OpenWhisk installation does not install certificates, so each `wsk` command you use when verifying your installation should use the `-i` switch and when you use `curl` against any API endpoints you create, you'll need to use the `--insecure` switch.

To verify your OpenWhisk installation, put the following into a `greeting.js` file:

```js
/**
 * @params is a JSON object with optional fields "name" and "place".
 * @return a JSON object containing the message in a field called "msg".
 */
function main(params) {
  // log the paramaters to stdout
  console.log('params:', params);

  // if a value for name is provided, use it else use a default
  var name = params.name || 'stranger';

  // if a value for place is provided, use it else use a default
  var place = params.place || 'somewhere';

  // construct the message using the values for name and place
  return {msg:  'Hello, ' + name + ' from ' + place + '!'};
}
```

Then execute:

```bash
wsk action create greeting greeting.js -i --web true
```
You should then be able to invoke the newly created action using the `wsk` command line:

```bash
$ wsk action invoke greeting --result --param place Kansas --param name Dorothy -i
{
    "msg": "Hello, Dorothy from Kansas!"
}
```

or using `curl`:

```bash
$ curl -X POST --header "Content-Type:application/json" -d '{"place":"Kansas"}' --insecure https://10.10.20.202:31001/api/v1/web/guest/default/greeting.json
{
  "msg": "Hello, stranger from Kansas!"
}
```

or even:

```bash
$ curl --insecure https://10.10.20.202:31001/api/v1/web/guest/default/greeting.json
{
  "msg": "Hello, stranger from somewhere!"
}
```

## Troubleshooting
Having trouble?  Help is available!

For setups of the individual FONK components, [feel free to join us on Slack](https://join.slack.com/t/fonk-apps/shared_invite/enQtNDEwNTc4NDI0OTMzLTNhZjA3MTE1NTdjMjY3MWJkM2MwNGViNGJlNWVhNGFlNDZjOWExMzViNzkyMTcyMjA3YmU4MmYwNGEyZGVlODA).  There are sometimes nuances for different k8s host & FaaS runtime combinations that aren't obvious.

Trying to implement your own functions?  Check out the [Function Troubleshooting Page](function-troubleshooting.md), which provides tips that contributors have discovered as different examples have been created.
