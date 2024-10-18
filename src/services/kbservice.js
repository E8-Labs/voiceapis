import axios from "axios";
import { constants } from "../../constants/constants.js";

export async function LabelVideoTranscript(transcript, user, video) {
  const model = "gpt-4-turbo"; // GPT-4 Turbo model
  const apiUrl = "https://api.openai.com/v1/chat/completions";

  // Pricing details for GPT-4 Turbo
  const pricePer1000Tokens = 0.03; // $0.03 per 1K tokens for GPT-4 Turbo

  try {
    // Replace the placeholders in the prompt with actual values
    let kbPrompt = constants.YoutubeLabellingPrompt;

    // Replace variables in the prompt
    kbPrompt = kbPrompt.replace(/{creatorname}/g, user.username);
    kbPrompt = kbPrompt.replace(/{titleofvideo}/g, video.title);

    console.log("Prompt: ", kbPrompt);

    // Function to check if response is incomplete
    const isResponseIncomplete = (response) => {
      // Check if the response ends with ellipses or an incomplete sentence
      return (
        response.endsWith("...") ||
        (!response.endsWith(".") &&
          !response.endsWith("?") &&
          !response.endsWith("!"))
      );
    };

    let completeResponse = "";
    let isIncomplete = true;

    while (isIncomplete) {
      // Send the request using Axios
      const response = await axios.post(
        apiUrl,
        {
          model: model,
          messages: [
            {
              role: "system",
              content: kbPrompt,
            },
            {
              role: "user",
              content: `Here is the transcript: ${transcript}`,
            },
          ],
          max_tokens: 4000, // Adjust max tokens as necessary
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.AIKey}`, // Replace with your actual API key
          },
        }
      );

      // Parse the response
      const result = response.data;
      let content = result.choices[0].message.content;
      content = content.replace(new RegExp("```json", "g"), "");
      content = content.replace(new RegExp("```", "g"), "");
      content = content.replace(new RegExp("\n", "g"), "");

      // Concatenate to the complete response
      completeResponse += content;

      // Check if the response is incomplete
      isIncomplete = isResponseIncomplete(content);

      if (isIncomplete) {
        // If incomplete, update the prompt to continue the response
        kbPrompt = `
            Continue labeling the transcript from where you left off.
          `;
        transcript = ""; // After first run, only ask to continue without re-sending the transcript
      }
    }

    // Calculate the number of tokens used
    // const tokensUsed = response.data.usage.total_tokens;
    // const cost = (tokensUsed / 1000) * pricePer1000Tokens;

    // Return the labeled transcript, token count, and cost
    return {
      labeledTranscript: completeResponse,
      //   tokensUsed: tokensUsed,
      //   cost: cost.toFixed(4), // Formatting cost to 4 decimal places
    };
  } catch (error) {
    console.error("Error processing video transcript:", error);
    return {
      error: error.message,
    };
  }
}

export async function processVideoTranscript(transcript, user, video) {
  const model = "gpt-4-turbo"; // You specified gpt-4, or it can be "gpt-4-turbo"
  const apiUrl = "https://api.openai.com/v1/chat/completions";

  // Pricing details for GPT-4
  const pricePer1000Tokens = 0.03; // $0.03 per 1K tokens for GPT-4 (adjust this based on OpenAI's pricing)

  try {
    // Make the request to the OpenAI API

    let kbPrompt = constants.YoutubeKbPrompt;
    kbPrompt = kbPrompt.replace(/{username}/g, user.username);
    kbPrompt = kbPrompt.replace(/{creatorname}/g, user.username);
    kbPrompt = kbPrompt.replace(/{titleofvideo}/g, video.title);

    console.log("prompt ", kbPrompt);
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AIKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: kbPrompt,
          },
          {
            role: "user",
            content: `Here is the transcript: ${transcript}`,
          },
        ],
        max_tokens: 4000, // Limit the number of tokens for the response (adjust as needed)
      }),
    });

    // Parse the response
    const result = await response.json();

    // Extract tokens used and summary from the response
    console.log("GPT Response ", result);
    let content = result.choices[0].message.content;
    content = content.replace(new RegExp("```json", "g"), "");
    content = content.replace(new RegExp("```", "g"), "");
    content = content.replace(new RegExp("\n", "g"), "");
    const summary = content;
    const tokensUsed = result.usage.total_tokens;
    const cost = (tokensUsed / 1000) * pricePer1000Tokens;

    // Return the summary, token count, and cost in a JSON object
    return {
      summary: summary,
      tokensUsed: tokensUsed,
      cost: cost.toFixed(4), // Formatting cost to 4 decimal places
    };
  } catch (error) {
    console.error("Error summarizing text:", error);
    return {
      error: error.message,
    };
  }
}
