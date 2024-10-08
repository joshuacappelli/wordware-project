import * as uuid from "uuid";
import { Table } from "sst/node/table";
import handler from "@wordware/core/handler";
import dynamoDb from "@wordware/core/dynamodb";

export const main = handler(async (event) => {
  let data = {
    content: "",
    title: "",
  };

  if (event.body != null) {
    data = JSON.parse(event.body);
    console.log(data);
  }

  if (!event.pathParameters || !event.pathParameters.promptId) {
    throw new Error("Missing path parameters: promptId");
  }

  const params = {
    TableName: Table.Prompts.tableName,
    Item: {
      userId: event.requestContext.authorizer?.iam.cognitoIdentity.identityId, // The id of the author
      promptId: uuid.v1(), // The id of the prompt
      title: data.title,
      outputId: uuid.v1(), // A unique uuid for the output
      connectionId: event.pathParameters.promptId,
      type: "output", // Distinguish between prompt and output
      content: data.content, // Output content
      createdAt: Date.now(), // Current Unix timestamp
    },
  };

  await dynamoDb.put(params);

  return JSON.stringify(params.Item);
});
