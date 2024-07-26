import { Table } from "sst/node/table";
import handler from "@wordware/core/handler";
import dynamoDb from "@wordware/core/dynamodb";

export const main = handler(async (event) => {
  const params = {
    TableName: Table.Prompts.tableName,
    Key: {
      userId: event.requestContext.authorizer?.iam.cognitoIdentity.identityId, // The id of the author
      promptId: event?.pathParameters?.id, // The id of the prompt from the path
    },
  };

  await dynamoDb.delete(params);

  return JSON.stringify({ status: true });
});