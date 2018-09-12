# Fission.io FONK Guestbook (Python)

This folder contains a version of the FONK Guestbook application written in Python using Fission.io.  Instructions below can be modified to run on any K8S cluster, with pointers provided to source material to help to that end.  The steps are as follows:

* Creating an environment
* Creating a package
* Deploying the functions
* Adding a route and testing your API with `curl`

## Creating an environment
Fission.io has the notion of [environments](https://docs.fission.io/0.9.2/usage/package/) within which functions run.  More or less, an environment is based on a container image and when an environment is created, Fission.io will manage a pool of containers based on that image within which functions can be injected.

For certain languages, an image upon which an environment is based can be used to as a build facility a function as well where external libraries or packages are managed.

To create a fresh Python environment capable of building functions:

```bash
$ fission env create --name pythonsrc --image fission/python-env:latest --builder fission/python-builder:latest
```
The environment can be verified with:

```bash
$ fission env list
NAME      UID                                  IMAGE                     POOLSIZE MINCPU MAXCPU MINMEMORY MAXMEMORY EXTNET GRACETIME
pythonsrc 670169f2-9ff3-11e8-8b2a-005056a340a6 fission/python-env:latest 3        0      0      0         0         false  360
```

## Creating a package
Languages like Python that use distributed packaging systems to resolve dependencies need to be bundled in a way that Fission.io can build the functions with dependencies correctly.

First, create a zip file for the function, which contains a `requirements.txt` file provided that lists dependencies, a `build.sh` file provided that executes the build, and a file with the function code:

```bash
$ zip -jr create-pkg.zip create/
  adding: build.sh (deflated 24%)
  adding: create.py (deflated 58%)
  adding: requirements.txt (stored 0%)
```

```bash
$ zip -jr list-pkg.zip list/
adding: build.sh (deflated 24%)
 adding: list.py (deflated 50%)
 adding: requirements.txt (stored 0%)
```

Next, create a Fission package by specifying the newly created .zip file, the relevant environment, and the build command:

```bash
$ fission package create --sourcearchive create-pkg.zip --env pythonsrc --buildcmd "./build.sh"
Package 'create-pkg-zip-iujy' created
```

```bash
$ fission package create --sourcearchive list-pkg.zip --env pythonsrc --buildcmd "./build.sh"
Package 'list-pkg-zip-72kw' created
```

Take note of the package name and confirm the build with the `package info` command:

```bash
$ fission package info --name create-pkg-zip-iujy
Name:        create-pkg-zip-iujy
Environment: pythonsrc
Status:      succeeded
Build Logs:
Collecting pymongo (from -r /packages/create-pkg-zip-iujy-gspdhu/requirements.txt (line 1))
  Downloading https://files.pythonhosted.org/packages/b2/c8/8911124c0900cf83e39124a2849b6c992b32cf8d94f88941b06759b43825/pymongo-3.7.1.tar.gz (723kB)
Installing collected packages: pymongo
  Running setup.py install for pymongo: started
    Running setup.py install for pymongo: finished with status 'done'
Successfully installed pymongo-3.7.1
```

```bash
$ fission package info --name list-pkg-zip-72kw
Name:        list-pkg-zip-72kw
Environment: pythonsrc
Status:      succeeded
Build Logs:
Collecting pymongo (from -r /packages/list-pkg-zip-72kw-04mgnf/requirements.txt (line 1))
  Using cached https://files.pythonhosted.org/packages/b2/c8/8911124c0900cf83e39124a2849b6c992b32cf8d94f88941b06759b43825/pymongo-3.7.1.tar.gz
Installing collected packages: pymongo
  Running setup.py install for pymongo: started
    Running setup.py install for pymongo: finished with status 'done'
Successfully installed pymongo-3.7.1
```
If errors are seen here, try the build a second time as sometimes network hiccups cause issues pulling down libraries.

## Deploying the functions
Now packaged and built, the functions are ready to be deployed:

```bash
$ fission fn create --name create --entrypoint "create.main" --pkg create-pkg-zip-iujy
function 'create' created
```

```bash
$ fission fn create --name list --entrypoint "list.main" --pkg list-pkg-zip-72kw
function 'list' created
```


From the command line, the functions can now be tested:

```bash
$ fission function test --name create --body '{"text":"Hello World"}'
{'updatedAt': 1536690969549, '_id': 5b980b197185640001bd984e, 'text': 'Hello World'}
```

```bash
$ fission function test --name list
{
  "entries": [
    {
      "_id": "5b980b197185640001bd984e",
      "updatedAt": 1536690969549,
      "text": "Hello World"
    }
  ]
}
```

## Adding a route and testing your API with `curl`
Fission has the facility to add routes to trigger function invocations independent from the deployed functions themselves.  To add routes for the two functions used in this example:

```bash
$ fission route create --method POST --url /create --function create
trigger 'bef78821-849c-4ba3-bcd1-4ca0dd6e4cd5' created
```
and
```bash
$ fission route create --method GET --url /list --function list
trigger '18b206b5-b3fb-4399-b397-2f544b6a2b7b' created
```


The functions can now be triggered in one of two ways, either using the IP address of the cluster master or the IP address of the Fission router service.  To see which is appropriate, look at the status of the Fission services:

```bash
$ kubectl get services -n fission
NAME             TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
controller       ClusterIP      10.108.251.214   <none>        80/TCP         5h
executor         ClusterIP      10.109.194.179   <none>        80/TCP         5h
influxdb         ClusterIP      10.97.252.35     <none>        8086/TCP       5h
nats-streaming   ClusterIP      10.108.60.235    <none>        4222/TCP       5h
router           LoadBalancer   10.98.91.221     <pending>     80:32746/TCP   5h
storagesvc       ClusterIP      10.104.57.38     <none>        80/TCP         5h
```
In this example, the underlying k8s cluster is unable to issue an external IP address for the router service.  If it were, simply use that IP address and port 80 when invoking `curl`.  For instances where there is no external IP address for the router service, discover the IP address of the cluster master:

```bash
$ kubectl cluster-info
Kubernetes master is running at https://10.10.20.202:6443
KubeDNS is running at https://10.10.20.202:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
```

and use that IP with the mapped port listed under the Fission router (in the example above, 32746):

```bash
$ curl -X POST http://10.10.20.202:32746/create -H "Content-Type: application/json" -d '{"text":"Hello Again"}'
{'_id': '5b9822a47825b10001ae1ab1', 'text': 'Hello Again', 'updatedAt': 1536696996386}
```

```bash
$ curl http://10.10.20.202:32746/list
{
  "entries": [
    {
      "updatedAt": 1536690969549,
      "_id": "5b980b197185640001bd984e",
      "text": "Hello World"
    },
    {
      "updatedAt": 1536696996386,
      "_id": "5b9822a47825b10001ae1ab1",
      "text": "Hello Again"
    }
  ]
}
```
The API endpoints tested are now tested, but one more step is required to handle the CORS header for the `create` API.  JavaScript running in browsers will make a preflight `OPTIONS` verb call prior to making a `POST`.  The code in `create/create.py` can handle this situation, but a route must be created for it:

```bash
$ fission route create --method OPTIONS --url /create --function create
trigger 'f4c6a64f-3ca6-42fe-9824-e24f1860d844' created
```
Which you can now test with:
```bash
curl -X OPTIONS http://10.10.20.202:32746/create -v
*   Trying 10.10.20.202...
* Connected to 10.10.20.202 (10.10.20.202) port 32511 (#0)
> OPTIONS /create HTTP/1.1
> Host: 10.10.20.202:32511
> User-Agent: curl/7.43.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: *
< Content-Length: 0
< Content-Type: text/html; charset=utf-8
< Date: Wed, 12 Sep 2018 15:16:38 GMT
<
```
CORS headers are now handled, so next [follow the instructions for configuring your front end.](../../../frontend/Readme.md)
