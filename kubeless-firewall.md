# Using Kubless Behind a Firewall

If you are running Kubeless behind a firewall, you can set the `http_proxy` environment variables to the `serverless.yaml` in order to get the build process to work correctly.  An example is below:

```diff
service: guestbook

provider:
  name: kubeless
  hostname: '172.28.225.184.xip.io'
  runtime: go1.10

plugins:
  - serverless-kubeless

functions:
  create:
    handler: guestbook.Create
+    environment:
+      https_proxy: proxy.esl.cisco.com:80
    events:
      - http:
          path: /create
  list:
    handler: guestbook.List
+   environment:
+      https_proxy: proxy.esl.cisco.com:80
    events:
      - http:
          path: /list

```
