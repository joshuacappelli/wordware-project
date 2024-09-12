import { APIGatewayProxyHandler } from "aws-lambda";
import { Table } from "sst/node/table";
import handler from "@wordware/core/handler";
import dynamoDb from "@wordware/core/dynamodb";


export const main = handler(async (event) => {
  const { outputId } = event.pathParameters || {};

  const params = {
    TableName: Table.Prompts.tableName, 
    Key: {
      userId: event.requestContext.authorizer?.iam.cognitoIdentity.identityId, 
      promptId: outputId,
    },
  };

  console.log(params);

  await dynamoDb.delete(params);

  return JSON.stringify({ status: true });
});
