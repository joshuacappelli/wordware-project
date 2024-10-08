import { Api, Config, StackContext, use } from "sst/constructs";
import { StorageStack } from "./StorageStack";

export function ApiStack({ stack }: StackContext) {
  const { table } = use(StorageStack);
  const HUGGING_FACE_SECRET_KEY = new Config.Secret(stack, "HUGGING_FACE_SECRET_KEY");

  // Create the API using SST Api construct
  const isProd = stack.stage === "production";
  const domainPrefix = isProd ? "api" : `api-${stack.stage}`;
  const domainName = `${domainPrefix}.tinkerapp.net`;

  const api = new Api(stack, "Api", {
    defaults: {
      authorizer: "iam",
      function: {
        bind: [table, HUGGING_FACE_SECRET_KEY],   // this binds to the DynamoDB table
      },
    },
    cors: true,
    customDomain: {
      domainName,
      hostedZone: "tinkerapp.net",
    },
    routes: {
      // routes for prompts
      "POST /prompts": "packages/functions/src/create.main",
      "GET /prompts/{id}": "packages/functions/src/get.main",
      "GET /prompts": "packages/functions/src/list.main",
      "PUT /prompts/{id}": "packages/functions/src/update.main",
      "DELETE /prompts/{id}": "packages/functions/src/delete.main",
      
      // routes for hugging face
      "POST /submit": "packages/functions/src/submit.main",
      "POST /submitSound" : "packages/functions/src/submitSound.main",
      
      // routes for outputs
      "POST /prompts/{promptId}/outputs": "packages/functions/src/createOutput.main",
      "GET /prompts/{promptId}/outputs": "packages/functions/src/getOutputs.main",
      "DELETE /outputs/{outputId}": "packages/functions/src/deleteOutput.main",
    },
  });

  // Show the API endpoint in the output
  stack.addOutputs({
    ApiEndpoint: api.url,
    CustomDomainUrl: api.customDomainUrl || "No custom domain configured",
  });

  // Return the API resource
  return {
    api,
  };
}
