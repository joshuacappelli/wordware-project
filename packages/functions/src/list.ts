import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { Table } from "sst/node/table";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const main = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.iam.cognitoIdentity.identityId;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing user identity" }),
    };
  }

  const params = {
    TableName: Table.Prompts.tableName,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  };

  try {
    const result = await dynamoDb.query(params).promise();

    // Filter the results to include only items with type 'prompt'
    const filteredItems = result.Items?.filter(item => item.type === 'prompt') || [];

    return {
      statusCode: 200,
      body: JSON.stringify(filteredItems),
    };
  } catch (error) {
    console.error("DynamoDB Query Error", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not retrieve prompts" }),
    };
  }
};
