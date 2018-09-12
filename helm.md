# So, you're new to Helm . . .
Many of the components on fonk-apps/examples make use of Helm to install themselves on your K8S cluster.  If you're new to Helm (the client, and Tiller, the server) it can be intimidating as a first step and while your mileage may vary, here are some simple steps that work most of the time to get you going quickly.

Per the
[Helm installation guide](https://docs.helm.sh/using_helm/#installing-helm), install the Helm client as needed and then set your security context so that Tiller can do its thing on your behalf:

```bash
kubectl -n kube-system create sa tiller \
 && kubectl create clusterrolebinding tiller \
      --clusterrole cluster-admin \
      --serviceaccount=kube-system:tiller
```
Then initialize Helm in your cluster:
```bash
helm init --skip-refresh --upgrade --service-account tiller
```
Confirm that Tiller is running in your cluster before continuing, when `tiller-deploy` should be among the pods listed with:

```bash
$ kubectl get pods -n kube-system
NAME                                              READY     STATUS    RESTARTS   AGE
.
.
.
tiller-deploy-75f5797b-x79bj                      1/1       Running   0          25s
```

From here, various `helm install` commands should work.
