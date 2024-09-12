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
    IndexName: 'GSI3', // Replace with your GSI name
    KeyConditionExpression: "connectionId = :connectionId AND #type = :type",
    ExpressionAttributeNames: {
      "#type": "type",
    },
    ExpressionAttributeValues: {
      ":connectionId": promptId, // Filter for items where connectionId matches
      ":type": "output",        // Filter for items where type is 'output'
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
