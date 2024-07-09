import { Table } from "sst/node/table";
import handler from "@wordware/core/handler";
import dynamoDb from "@wordware/core/dynamodb";

export const main = handler(async (event) => {
  const params = {
    TableName: Table.Prompts.tableName,
    Key: {
      userId: "123", // The id of the author
      noteId: event?.pathParameters?.id, // The id of the note from the path
    },
  };

  await dynamoDb.delete(params);

  return JSON.stringify({ status: true });
});