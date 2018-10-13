# OpenFaaS FONK Guestbook (Python)

This folder contains a version of the FONK Guestbook application written in Python using OpenFaas.  The steps are as follows:

* Creating `create.yml` and `list.yml`
* Building, Pushing, and Deploying the functions
* Testing your API with `curl`

## Creating `create.yml` and `list.yml`
In OpenFaaS, functions are defined using a .yml file format that describes where the OpenFaaS instance being used is located, where the function binary resides, and where the container image used to implement the function can be found.

In this folder, there are two templates for the two back-end Guestbook functions, `create.template` and `list.template`.  The first step is to edit each of these and save them as their .yml variants.  To do this, the master IP address of the Kubernetes cluster running OpenFaaS is needed, as is the username being used for the container image repo configured on your Docker command line.

## Building, Pushing, and Deploying the functions
OpenFaaS pulls container images from a repo at deployment time, after those images have been built and pushed to that repo.  While OpenFaaS hides the subsequent `Dockerfile` from the developer in its templating system, a local copy of Docker configured to talk to the repo in question is required before proceeding.

You will also need to install OpenFaaS templates that support Flask for Python:

```bash
faas-cli template pull https://github.com/openfaas-incubator/python-flask-template
```

You may check they have been correctly installed with:

```bash
faas-cli new --list
```

With those prerequisites in place, and keeping in mind that Docker often requires `sudo` access, here are the three commands needed to build, push, and deploy a function to OpenFaas.  First, build the container image that houses the function.

```bash
$ sudo faas-cli build -f create.yml
[0] > Building list.
Clearing temporary build folder: ./build/create/
Preparing ./create/ ./build/create/function
Building: <username>/create with python27-flask template. Please wait..
Sending build context to Docker daemon  11.78kB
Step 1/19 : FROM python:2.7-alpine
 ---> b2bc7255b42c
Step 2/19 : RUN apk --no-cache add curl     && echo "Pulling watchdog binary from Github."     && curl -sSLf https://github.com/openfaas-incubator/of-watchdog/releases/download/0.4.0/of-watchdog > /usr/bin/fwatchdog     && chmod +x /usr/bin/fwatchdog     && apk del curl --no-cache
.
.
.
Step 19/19 : CMD ["fwatchdog"]
 ---> Running in 91ff344e12a6
Removing intermediate container 91ff344e12a6
 ---> f6d583c37b92
Successfully built d8c3cf003d6d
Successfully tagged <username>/create:latest
Image: <username>/create built.
[0] < Building create done.
[0] worker done.
```

Next, push that image to the repo:
```bash
$ sudo faas-cli push -f create.yml
[0] > Pushing create.
The push refers to repository [docker.io/<username>/create]
b5f158794b91: Pushed
6293e4114d0e: Pushed
.
.
.
latest: digest: sha256:4fa962fa09d0d6e05190e006c94fc7c1e4d0f5f3eec1dbc0c7dfce2a13005396 size: 3038
[0] < Pushing create done.
[0] worker done.
```

Finally, deploy the image to the OpenFaaS instance:
```bash
$ sudo faas-cli deploy -f create.yml
Deploying: create.

Deployed. 202 Accepted.
URL: http://10.10.20.202:31112/function/create
```

The function is now invokable using the `faas-cli`:

```bash
$ faas-cli invoke -f create.yml create
Reading from STDIN - hit (Control + D) to stop.
{"text":"Hello World"}                          
{"updatedAt":1536263027935,"text":"Hello World","_id":"5b9183737c17c7000a6e1aca"}
```

(please note Mac users will need to press ctrl+alt+D)

Rinse and repeat for `list`:

```bash
$ sudo faas-cli build -f list.yml
$ sudo faas-cli push -f list.yml
$ sudo faas-cli deploy -f list.yml
```

and the invoke output should look similar to:
```bash
$ faas-cli invoke -f list.yml list
Reading from STDIN - hit (Control + D) to stop.
{"entries":[{"_id":"5b9183737c17c7000a6e1aca","updatedAt":1536263027935,"text":"Hello World"}]}
```

(please note Mac users will need to press ctrl+alt+D)

## Testing your API with `curl`
Among the information the `deploy` command returns with is the URL that can be used to invoke the function with `curl`.  So using the examples above `create` looks like this:

```bash
$ curl -X POST --header "Content-Type:application/json" -d '{"text":"Hello Again"}'  http://10.10.20.202:31112/function/create
{
  "updatedAt":1536263964550,
  "text":"Hello Again",
  "_id":"5b91871cc2cbee00084dd16f"
}
```

and `list`:

```bash
$ curl http://10.10.20.202:31112/function/list
{
  "entries":[{
    "_id":"5b9183737c17c7000a6e1aca",
    "updatedAt":1536263027935,
    "text":"Hello World"},
    {"_id":"5b91871cc2cbee00084dd16f",
    "updatedAt":1536263964550,
    "text":"Hello Again"}]
}
```

These two URLs can now be used on the `frontend`, although note in the source code of the functions that the OpenFaaS API gateway does not return `Access-Control-Allow-Origin: *` by default, hence why that is set explicitly by each function to avoid CORS issues with the GUI.
