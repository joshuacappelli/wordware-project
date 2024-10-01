import { APIGatewayProxyHandler } from "aws-lambda";
import { Config } from "sst/node/config"; // For retrieving Hugging Face API key securely
import axios from "axios"; // For fetching file from S3
import fetch from "node-fetch"; // For making requests to Hugging Face API

export const main: APIGatewayProxyHandler = async (event) => {
  const HUGGING_FACE_TOKEN = Config.HUGGING_FACE_SECRET_KEY;

  // Extract the fileUrl and model from the request body
  const body = JSON.parse(event.body || "{}");
  const { fileUrl, model } = body;

  console.log("Received file URL:", fileUrl);

  if (!fileUrl || !model) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "File URL and model are required" }),
    };
  }

  try {
    // 1. Fetch the file data from the S3 signed URL
    const fileResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const fileData = fileResponse.data;

    console.log("File successfully downloaded from S3");

    // 2. Call the Hugging Face Whisper API using the file data
    const whisperResponse = await fetch(
      "https://api-inference.huggingface.co/models/openai/whisper-large-v3",
      {
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
          "Content-Type": "application/octet-stream", // Send as binary data
        },
        method: "POST",
        body: fileData, // Send the binary data to Hugging Face API
      }
    );

    // 3. Parse the response from Hugging Face API
    const result = await whisperResponse.json();
    console.log("this is the response:", result);
    // 4. Return the Whisper API response
    return {
      statusCode: 200,
      body: JSON.stringify(result), // Send the Whisper model result
    };

  } catch (error) {
    console.error("Error occurred:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to process the file",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
