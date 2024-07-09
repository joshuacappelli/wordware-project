import { Bucket, StackContext, Table } from "sst/constructs";

export function StorageStack({ stack }: StackContext) {
  // Create the DynamoDB table
  // Create an S3 bucket
  const bucket = new Bucket(stack, "Uploads");
  const table = new Table(stack, "Prompts", {
    fields: {
      userId: "string",
      promptId: "string",
    },
    primaryIndex: { partitionKey: "userId", sortKey: "promptId" },
  });

  return {
    bucket,
    table,
  };
}