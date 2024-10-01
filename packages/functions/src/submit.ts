import { APIGatewayProxyHandler } from "aws-lambda";
import { Config } from "sst/node/config";
import axios, { AxiosResponse } from "axios";

export const main: APIGatewayProxyHandler = async (event) => {
  try {
    const { prompt, model } = JSON.parse(event.body || "{}");

    // Check if required parameters are present
    if (!prompt || !model) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Model or Prompt missing" }),
      };
    }

    const HUGGING_FACE_TOKEN = Config.HUGGING_FACE_SECRET_KEY;

    // Make the API request to Hugging Face Inference API
    const response: AxiosResponse<any, any> = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Return the API response data if the request is successful
    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorDetails = {
        message: "Failed to call Hugging Face API",
        errorMessage: error.message,
        errorResponse: error.response?.data || null,
        statusCode,
      };
      return {
        statusCode,
        body: JSON.stringify(errorDetails),
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: "An unknown error occurred",
          details: error instanceof Error ? error.message : "Unknown error"
        }),
      };
    }
  }
};
