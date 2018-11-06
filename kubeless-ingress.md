# Fixing Kubless Ingress Issues

In order to operate `curl` or the web front end UI against a Kubeless deployed set of functions, the ingress needs to be set in a specific way.  This is a two-step process where the first step depends on your K8S setup and the second step is the same.

## Step 1: Determining your ingress hostname
Depending upon your K8S setup, your ingress hostname may vary greatly.  Here are three common scenarios, although more may exist.

### Scenario 1: Deploying Your Own Ingress
In the simplest scenario, you have deployed your own ingress.  Find the IP address of your ingress and add `xip.io` to it.  For example, if your ingress controller host is `35.233.180.47` your hostname for Step 2 will be `35.233.180.47.xip.io`.  Using `xip.io` redirects any external traffic to our localhost.  Works great!

### Scenario 2: CCP
If you are using Cisco Container Platform 1.5 or later, CCP provides a load balancer that can be used as an ingress.  To find its IP address:
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
In this example, the external IP address to use is `10.10.20.209` and the hostname to use in Step 2 would be `10.10.20.209.xip.io`.

### Scenario 3: GKE
If, during the Kubeless deployment process, you followed [the NGINX GKE installation instructions](https://github.com/kubernetes/ingress-nginx/blob/master/docs/deploy/index.md) you'll likely notice that the ingress doesn't get populated properly when using the Serverless Framework.  First, try deploying your functions:

```
serverless deploy
```

Next, inspect the ingress:

```bash
$ kubectl get ingress
NAME        HOSTS                  ADDRESS         PORTS     AGE
guestbook   35.233.239.77.xip.io   35.233.180.47   80        2m
```
This example exhibits the configuration issue where the IP address under `HOSTS` does not match that under `ADDRESS`.  To fix this use:

```bash
kubectl edit ingress guestbook
```

This will launch a `vi` session with the configuration being used by Kubernetes to manage this ingress.  On the `host` line that lists the `*.xip.io` entry with the incorrect IP address, change it to reflect the correct IP address, which can be found in the `ingress:ip` entry at the end of the file or using the CCP load balancer external IP address.  After saving and exiting, you should now see your changes with `kubectl get ingress`.

To keep your changes for future deployments, use `HOSTS` as your hostname for Step 2.  In this example, `35.233.239.77.xip.io`.


## Step 2: Setting your igress hostname in `serverless.yml`

With the ingress hostname known, set it in `serverless.yml`:

```
provider:
  name: kubeless
  hostname: <your host name>
```
