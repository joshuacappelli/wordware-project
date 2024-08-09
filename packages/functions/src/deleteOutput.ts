import { Table } from "sst/node/table";
import handler from "@wordware/core/handler";
import dynamoDb from "@wordware/core/dynamodb";

export const main = handler(async (event) => {
  const { userId, promptId, outputId } = event.pathParameters || {};

  if (!userId || !promptId || !outputId) {
    throw new Error("Missing required path parameters: userId, promptId, or outputId");
  }

  const params = {
    TableName: Table.Prompts.tableName,
    Key: {
      userId,
      promptId,
      outputId
    },
  };

  await dynamoDb.delete(params);

  return JSON.stringify({ status: true });
});
