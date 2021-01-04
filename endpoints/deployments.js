import {
  createGenericListEndpoint,
  createGenericGetEndpoint,
  createGenericDeleteEndpoint,
  createGenericJsonUpdateEndpoint,
  createGenericSubscriptionEndpoint,
} from "../utils/genericEndpoints";

const resourceType = { kind: "Deployment", apiVersion: "apps/v1" };

export default function createDeploymentEndpoints(kubeconfig, app) {
  const serverAddress = kubeconfig.getCurrentCluster().server;
  console.log('test')
  createGenericListEndpoint(kubeconfig, app)(
    "/apis/apps/v1/namespaces/:namespace/deployments",
    `${serverAddress}/apis/apps/v1/namespaces/{namespace}/deployments`,
    true,
    resourceType
  );

  createGenericGetEndpoint(kubeconfig, app)(
    "/apis/apps/v1/namespaces/:namespace/deployments/:name",
    `${serverAddress}/apis/apps/v1/namespaces/{namespace}/deployments/{name}`,
    true,
    resourceType
  );

  createGenericJsonUpdateEndpoint(kubeconfig, app)(
    "/apis/apps/v1/namespaces/:namespace/deployments/:name",
    `${serverAddress}/apis/apps/v1/namespaces/{namespace}/deployments/{name}`
  );

  createGenericDeleteEndpoint(kubeconfig, app)(
    "/apis/apps/v1/namespaces/:namespace/deployments/:name",
    `${serverAddress}/apis/apps/v1/namespaces/{namespace}/deployments/{name}`
  );

  createGenericSubscriptionEndpoint(app)(
    "deployments",
    `${serverAddress}/apis/apps/v1/namespaces/{namespace}/deployments?watch=true`,
    true,
    resourceType
  );
}
