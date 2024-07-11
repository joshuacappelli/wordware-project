import handler from "@wordware/core/handler";
import { Config } from "sst/node/config";
import axios from "axios";

export const main = handler(async (event) => {
  const { prompt, model } = JSON.parse(event.body || "{}");

  if (!prompt || !model) {
    return JSON.stringify({
      statusCode: 400,
      body: JSON.stringify({ error: "Model or Prompt missing" }),
    });
  }

  const HUGGING_FACE_TOKEN = Config.HUGGING_FACE_SECRET_KEY;

  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
          "Content-Type": "application/json",
          
        },
      }
    );

    const result = response.data;

    return JSON.stringify({
      statusCode: 200,
      body: JSON.stringify(result),
    });
  } catch (error) {
    console.error(error);
    return JSON.stringify({
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to call Hugging Face API" }),
    });
  }
});
