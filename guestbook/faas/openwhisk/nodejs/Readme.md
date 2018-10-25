# OpenWhisk FONK Guestbook (Node.js)

This folder contains a version of the FONK Guestbook application written in Node.js using OpenWhisk. The steps to getting it running are as follows:

* Creating `serverless.yml`
* Deploying the functions
* Testing your API with `curl`
* Bypassing the SSL Certificate

## Creating `serverless.yml`
In order to simplify packaging for deployment, the [Serverless Framework](http://serverless.com) is used to deploy your functions onto OpenWhisk.  Before proceeding, be sure to [follow the installation instructions there.](https://serverless.com/framework/docs/providers/openwhisk/guide/quick-start/).

OpenWhisk executes functions in such a way that they do not have any Kubernetes (aka k8s) context and therefore cannot take advantage of k8s naming conventions when accessing microservices running in other parts of the cluster, such as the MongoDB being used to store Guestbook data.  `fonkdb-mongodb.default:27017` will not work since that assumes k8s context, so the information about the Mongo host needs to be passed in another way.

OpenWhisk does not support environment variables, per se, but it does support default parameters, which can be set in the `serverless.yml` file. If you look at the code in either of our functions, found in `./create.js` or `./list.js` notice how the MongoDB connection is made:

```js
var url = 'mongodb://' + params.mongoHost + '/guestbook_app';

MongoClient.connect(url, (err, db) => {
  .
  .
  .
});
```

In this case, when deploying the functions a default parameter named `mongoHost` needs to be set in `serverless.yml` to a MongoDB host string that will enable each function to connect to MongoDB without using k8s naming conventions.

To discover what to set `mongoHost` should be, start with:

```bash
$ kubectl get services
NAME              TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)           AGE
fonkdb-mongodb   LoadBalancer   10.105.107.36   <pending>     27017:31073/TCP   32m
```

When MongoDB was deployed, it was configured to utilize a `LoadBalancer` so that a host string could be constructed.  There are two ways to create the host string and your mileage may vary on each path depending up on the external IP address capabilities of your k8s cluster.

In this example, the `CLUSTER-IP` is showing a private IP address and a pending `EXTERNAL-IP` address for what is likely a cluster not capable of generating an `EXTERNAL-IP`.

If your cluster is capable of generating an `EXTERNAL-IP` and it is shown when executing the command above, your host string is simply `<EXTERNAL-IP>:27017`.

If your cluster is not capable of generating an `EXTERNAL-IP`, see what port Mongo is mapped to (`31073` in the example above) and use `kubectl cluster-info` to find your cluster master IP address.  The host string is then `<cluster master IP>:<mapped port>`.

Now go into `serverless.template` and notice the two places where this MongoDB host:port string should be set.  Insert your values and save your changes as `serverless.yml`.

## Deploying the functions
With the `serverless.yml` saved, the function dependencies can be installed and then the functions deployed using:

```bash
npm install
serverless deploy -v
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

$ curl --insecure https://10.10.20.202:31001/api/v1/web/guest/default/list.json
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
