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
      connectionId: "string",
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
      GSI2: { // New GSI for querying by connectionId and promptId
        partitionKey: "connectionId",
        sortKey: "promptId",  // Optional: Include sort key if needed
        projection: "all",
      },
      GSI3: { // New GSI for querying by connectionId and promptId
        partitionKey: "connectionId",
        sortKey: "type",  // Optional: Include sort key if needed
        projection: "all",
      },
    },
  });

  return {
    table,
    bucket,
  };
}
