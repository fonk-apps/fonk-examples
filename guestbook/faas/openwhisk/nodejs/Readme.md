# OpenWhisk FONK Guestbook (Node.js)

This folder contains a version of the FONK Guestbook application written in Node.js using OpenWhisk. The steps to getting it running are as follows:

* Packaging the functions
* Deploying the functions
* Testing your API with `curl`
* Bypassing the SSL Certificate

## Packaging the functions
For Node.js, OpenWhisk can accept a .zip file that has all dependencies packaged within it needed for function execution.  To create the needed .zip file for the `create` function:

```bash
cd create
npm install
zip -r create.zip *
cd ..
```

Similarly, for the `list` function:

```bash
cd list
npm install
zip -r list.zip *
cd ..
```

## Deploying the functions
OpenWhisk executes functions in such a way that they do not have any K8S context and therefore cannot take advantage of K8S naming conventions when accessing microservices running in other parts of the cluster, such as the MongoDB being used to store Guestbook data.  `fonkdb-mongodb.default:27017` will not work since that assumes K8S context, so the information about the Mongo host needs to be passed in another way.

OpenWhisk does not support environment variables, per se, but it does support default parameters. If you look at the code in either of our functions, found in `./create/index.js` or `./list/index.js` notice how the MongoDB connection is made:

```js
var url = 'mongodb://' + params.mongoHost + '/guestbook_app';

MongoClient.connect(url, (err, db) => {
  .
  .
  .
});
```

 In this case, when deploying the functions a default parameter named `mongoHost` needs to be set to a MongoDB host string that will enable each function to connect to MongoDB without using K8S naming conventions.

To discover what to set `mongoHost` should be, start with:

```bash
$ kubectl get services
NAME              TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)           AGE
fonkdb-mongodb   LoadBalancer   10.105.107.36   <pending>     27017:31073/TCP   32m
```

When MongoDB was deployed, it was configured to utilize a `LoadBalancer` so that a host string could be constructed.  There are two ways to create the host string and your mileage may vary on each path depending up on the external IP address capabilities of your K8S cluster.

In this example, the `CLUSTER-IP` is showing a private IP address and a pending `EXTERNAL-IP` address for what is likely a cluster not capable of generating an `EXTERNAL-IP`.

If your cluster is capable of generating an `EXTERNAL-IP` and it is shown when executing the command above, your host string is simply `<EXTERNAL-IP>:27017`.

If your cluster is not capable of generating an `EXTERNAL-IP`, see what port Mongo is mapped to (`31073` in the example above) and use `kubecltl cluster-info` to find your cluster master IP address.  The host string is then <cluster master IP>:<mapped port>.

With the functions now packaged and the MongoDB host string determined, the functions can be deployed using:

```bash
wsk action create create ./create/create.zip --kind nodejs:default -i --web true --param mongoHost <host string>
```

and

```bash
wsk action create list ./list/list.zip --kind nodejs:default -i --web true --param mongoHost <host string>
```

With the functions now deployed on OpenWhisk, they can can be invoked using the `wsk` command line:

```bash
$ wsk action invoke create --param text 'Hello World' -i --result
{"text":"Hello World","id":"96c40bf0-9fce-11e8-bae7-c9e603322f7a","updatedAt":1534257027631,"_id":"5b72e783b7e86e82fc592440"}

$ wsk action invoke list -i --result
[{"_id":"5b72e783b7e86e82fc592440","text":"Hello World","id":"96c40bf0-9fce-11e8-bae7-c9e603322f7a","updatedAt":1534257027631}]
```

But what about interacting with the functions through an API endpoint?  

## Testing your API with `curl`
Because functions were created with the `--web true` switch, they are now reachable with `curl`:

```bash
$ curl -X POST --header "Content-Type:application/json" -d '{"text":"Hello Again"}' --insecure https://10.10.20.202:31001/api/v1/web/guest/default/create.json
{
  "text": "Hello Again",
  "id": "05cfd6b0-a23a-11e8-86ec-8f9a22b282bf",
  "updatedAt": 1534523072411,
  "_id": "5b76f6c060ae0a00072bc655"
}

$ curl --insecure https://10.10.20.202:31001/api/v1/web/guest/default/list.jsn
{
  "entries": [{
    "_id": "5b76ec2ad6827500052378f4",
    "text": "Hello World",
    "id": "b66208b0-a233-11e8-b878-ffe412a8988f",
    "updatedAt": 1534520362171
  }, {
    "_id": "5b76ef74d45b63000577a142",
    "text": "Hello Again",
    "id": "ac7a9040-a235-11e8-8e4a-635e3a97c9a7",
    "updatedAt": 1534521204548
  }]
}

```

## Bypassing the SSL Certificate
OpenWhisk ships with a self-signed certificate and requires HTTPS, which by default the code in the front end will not work correctly because every browser in the world will by default require signed certificates.

To work around this, the URL for the functions can be entered in the browser you will use to conduct run the front end.  Something like:


```bash
https://<IP address>:31001/api/v1/web/guest/default/list.json
```

Your browser will detect the self-signed certificate and give you the familiar warning.  If you accept the risks and add the exception, the underlying code will now work correctly.

With your API endpoints tested and the SSL Certificate bypassed, [follow the instructions for configuring your front end.](../../../frontend/Readme.md)
