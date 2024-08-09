import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { Table } from "sst/node/table";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const main = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { promptId } = event.pathParameters || {};
  const userId = event.requestContext.authorizer?.iam.cognitoIdentity.identityId;

  if (!promptId || !userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required path parameter or user identity" }),
    };
  }

  const params = {
    TableName: Table.Prompts.tableName,
    KeyConditionExpression: "userId = :userId AND promptId = :promptId",
    ExpressionAttributeValues: {
      ":userId": userId,
      ":promptId": promptId,
    },
  };

  try {
    const result = await dynamoDb.query(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    console.error("DynamoDB Query Error", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not retrieve outputs" }),
    };
  }
};
