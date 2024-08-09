import { APIGatewayProxyHandler } from "aws-lambda";
import { Config } from "sst/node/config";
import axios, { AxiosResponse } from "axios";

export const main: APIGatewayProxyHandler = async (event) => {
  let response: AxiosResponse<any, any> | undefined;
  try {
    const { prompt, model } = JSON.parse(event.body || "{}");
    console.log(model);
    console.log(prompt);

    if (!prompt || !model) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Model or Prompt missing" }),
      };
    }

    const HUGGING_FACE_TOKEN = Config.HUGGING_FACE_SECRET_KEY;

    const MAX_RETRIES = 5;
    let retryCount = 0;
    let success = false;

    while (!success && retryCount < MAX_RETRIES) {
      try {
        response = await axios.post(
          `https://api-inference.huggingface.co/models/${model}`,
          { inputs: prompt },
          {
            headers: {
              Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        success = true;
      } catch (error) {
        retryCount++;

        if (axios.isAxiosError(error) && error.response && error.response.status === 503) {
          const waitTime = (error.response.data?.estimated_time || 30) * 1000; // Default wait time is 30 seconds
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else if (axios.isAxiosError(error)) {
          return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to call Hugging Face API", details: error.message }),
          };
        } else {
          return {
            statusCode: 500,
            body: JSON.stringify({ error: "An unknown error occurred" }),
          };
        }
      }
    }

    if (!success || !response) {
      return {
        statusCode: 503,
        body: JSON.stringify({ error: "Service Unavailable after retries" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "An error occurred while processing your request." }),
    };
  }
};
