const express = require("express");
const socketIO = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const https = require('https');
const { createProxyMiddleware } = require('http-proxy-middleware');
const SubscriptionPool = require("./SubscriptionPool");
import injectHeaders from "./utils/headerInjector";

import compression from "compression";

import { initializeKubeconfig } from "./utils/kubeconfig";
import { initializeApp } from "./utils/initialization";
import { HttpError } from "./utils/other";
import { KubernetesObjectApi } from "@kubernetes/client-node";

import createPodEndpoints from "./endpoints/pods";
import createDeploymentEndpoints from "./endpoints/deployments";
import { createGenericCreateEndpoint } from "./endpoints/generic";

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: "*" })); //TODO
const kubeconfig = initializeKubeconfig();
const server = http.createServer(app);
const io = socketIO(server, { transports: ["websocket", "polling"] });
app.set("subscriptionEndpoints", {});

const k8sClient = KubernetesObjectApi.makeApiClient(kubeconfig);
createPodEndpoints(kubeconfig, app);
createDeploymentEndpoints(kubeconfig, app);
createGenericCreateEndpoint(k8sClient, app);

const target = kubeconfig.getCurrentCluster().server;

// const opts = {};
// kubeconfig.applyToRequest(opts);
// const agent = new https.Agent({ca: opts.ca});
// console.log('agent',agent.ca)
const agent = app.get("https_agent");
console.log('target', target)
const proxySettings = {
  target,
  agent,
  headers: {
    "Connection": "keep-alive"
  },
  ws: true,
  secure: true,
  changeOrigin: true,
  logLevel: 'debug',
  onProxyReq: async (proxyReq, req, res) => {
    const opts = await injectHeaders({ agent }, req.headers, kubeconfig, app);
    console.log('opts', opts)
  },
 
  onError,
};
app.use('/*', createProxyMiddleware(proxySettings));

new SubscriptionPool(io, kubeconfig, app);

app.use(compression()); //Compress all routes

// keep the error handlers as the last routes added to the app
app.use(function (req, res, next) {
  res.status(404).send("URL " + req.url + " not found");
});
app.use(function (err, req, res, next) {
  if (err instanceof HttpError) {
    e.send(res);
    return;
  }

  res.status(500).send("Internal server error");
});

const port = process.env.PORT || 3001;
const address = process.env.ADDRESS || "localhost";
console.log(`Domain used: ${kubeconfig.getCurrentCluster().name}`);

initializeApp(app, kubeconfig)
  .then((_) => {
    server.listen(port, address, () => {
      console.log(`👙 PAMELA 👄  server started @ ${port}!`);
    });
  })
  .catch((err) => {
    console.error("PANIC!", err);
    process.exit(1);
  });

function onError(err, req, res) {
  console.log('Error in proxied request', err, req.method, req.url);
}