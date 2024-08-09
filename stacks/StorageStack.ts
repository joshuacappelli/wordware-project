import { Bucket, StackContext, Table } from "sst/constructs";

export function StorageStack({ stack }: StackContext) {
  // Create the S3 bucket
  const bucket = new Bucket(stack, "Uploads", {
    cors: [
      {
        maxAge: "1 day",
        allowedOrigins: ["*"],
        allowedHeaders: ["*"],
        allowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      },
    ],
  });

  const table = new Table(stack, "Prompts", {
    fields: {
      userId: "string",
      promptId: "string",
      outputId: "string", // New field for output ID
      type: "string",     // Attribute to distinguish between prompt and output
    },
    primaryIndex: { partitionKey: "userId", sortKey: "promptId" },
    globalIndexes: {
      GSI1: {
        partitionKey: "promptId",
        sortKey: "type",
        projection: "all",
      },
    },
  });

  return {
    bucket,
    table,
  };
}
