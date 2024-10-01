import { Table } from "sst/node/table";
import handler from "@wordware/core/handler";
import dynamoDb from "@wordware/core/dynamodb";

export const main = handler(async (event) => {
  const userId = event.requestContext.authorizer?.iam.cognitoIdentity.identityId;
  const promptId = event?.pathParameters?.id;
  
  if (!userId || !promptId) {
    throw new Error("Missing userId or promptId.");
  }

  const params = {
    TableName: Table.Prompts.tableName,
    Key: {
      userId,
      promptId,
    },
  };

  const result = await dynamoDb.get(params);
  if (!result.Item) {
    throw new Error("Item not found.");
  }

  // Return the retrieved item
  return JSON.stringify(result.Item);
});
