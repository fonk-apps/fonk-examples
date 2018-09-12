# FONK Guestbook Front End
The FONK Guestbook Front End setup steps are as follows:

* Accessing the Minio UI & Creating a Public Bucket
* Setting Your API Endpoints
* Deploying & Testing Your Front End

## Accessing the Minio UI & Creating a Public Bucket
There are two ways to interact with the Minio GUI and your mileage may vary on each path depending up on the external IP address capabilities of your K8S cluster.  Start with:

```bash
$ kubectl get services
NAME              TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)           AGE
fonkfe-minio      LoadBalancer   10.102.57.24    <pending>     9000:30126/TCP    18m
```

In this example, the `CLUSTER-IP` is showing a private IP address and a pending `EXTERNAL-IP` address for what is likely a cluster not capable of generating an `EXTERNAL-IP`.

If your cluster is capable of generating an `EXTERNAL-IP`, point a browser to simply `http://<your IP>:9000/`.

If your cluster is not capable of generating an `EXTERNAL-IP`, see what port Minio is mapped to and point a browser to `http://<cluster master IP>:<mapped port>/`.  In the example above, where the master IP (not shown above, but determined with `kubecltl cluster-info`) that would evaluate to `http://< cluster master IP>:30126`.

Regardless of which method you use to engage the Minio GUI, you will be prompted to provide a Access Key and Secret Key.  The default Access Key is `AKIAIOSFODNN7EXAMPLE` and default Secret Key is `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`.  After logging in you should see something similar to:

![Minio UI](minio-ui.jpg)

Click on the big red + sign and create a bucket named `guestbook`.  Once that is created, hover over the bucket name in the left side bar to reveal three vertical dots:

![guestbook bucket](guestbook-bucket.jpg)

Click on the three dots and select `Edit Policy`.  Add a new policy that has a Prefix of `*` and Read Only:

![bucket policy](bucket-policy.jpg)

This will enable you to point to `http://<your ip>:9000/guestbook/index.html` from a browser in later steps.

## Setting Your API Endpoints
In `rest.js`, the first two lines read as:

```js
createPath = ''; // Path to create API endpoint
listPath = ''; // Path to list API endpoint
```

As the comment suggests, place the URL path to the `create` and `list` API endpoints.  With some FaaS runtimes, these two strings will be the same.  Then save the file with your changes.

## Deploying & Testing Your Front End
With the `guestbook` bucket selected in the Minio UI, click on the big red + sign and upload both `index.html` and your newly edited `rest.js`.

Point a fresh browser tab to `http://<your ip>:9000/guestbook/index.html` and interact with the Guestbook.

![guestbook ui](guestbook-ui.jpg)

Note that, depending upon a variety of performance factors, as messages are added from the GUI the MongoDB write may not happen quickly enough for the subsequent GUI read to catch up with it.  As such, refreshing the browser to get a fresh pull of the recently written data may be needed.
