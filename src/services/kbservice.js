import axios from "axios";
import { constants } from "../../constants/constants.js";

// export async function LabelVideoTranscript(transcript, user, video) {
//   const model = "gpt-4-turbo"; // GPT-4 Turbo model
//   const apiUrl = "https://api.openai.com/v1/chat/completions";

//   // Pricing details for GPT-4 Turbo
//   const pricePer1000Tokens = 0.03; // $0.03 per 1K tokens for GPT-4 Turbo

//   try {
//     // Replace the placeholders in the prompt with actual values
//     let kbPrompt = constants.YoutubeLabellingPrompt;

//     // Replace variables in the prompt
//     kbPrompt = kbPrompt.replace(/{creatorname}/g, user.username);
//     kbPrompt = kbPrompt.replace(/{titleofvideo}/g, video.title);

//     let completeResponse = "";
//     let isIncomplete = true;
//     let i = 0;

//     // Function to count words in a string
//     const countWords = (str) => {
//       return str.split(/\s+/).filter((word) => word.length > 0).length;
//     };

//     const totalTranscriptWords = countWords(transcript);

//     let promptTokens = 0,
//       completionTokens = 0;

//     while (isIncomplete) {
//       console.log("While loop iteration: ", i);
//       i += 1;

//       // Construct messages
//       let messages = [
//         {
//           role: "system",
//           content: kbPrompt,
//         },
//         {
//           role: "user",
//           content: `Here is the transcript: ${transcript}`,
//         },
//       ];

//       if (completeResponse.length > 0) {
//         console.log("Continuing from where we left off...");
//         messages.push({
//           role: "user",
//           content: `Continue from the previous generated transcript: ${completeResponse}`,
//         });
//       }

//       const response = await axios.post(
//         apiUrl,
//         {
//           model: model,
//           messages: messages,
//           max_tokens: 4000, // Adjust max tokens as necessary
//         },
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${process.env.AIKey}`, // Replace with your actual API key
//           },
//         }
//       );

//       // Parse the response
//       const result = response.data;
//       let content = result.choices[0].message.content.trim();
//       promptTokens += result.usage.prompt_tokens || 0;
//       completionTokens += result.usage.completion_tokens || 0;

//       // Concatenate to the complete response
//       completeResponse += content;

//       // Calculate word count of labeled transcript
//       const labeledTranscriptWords = countWords(completeResponse);

//       // Check the finish_reason to determine if the response is complete
//       const finishReason = result.choices[0].finish_reason;
//       console.log("--------------------------------------------------\n");
//       console.log("Finish Reason:", finishReason);
//       console.log(
//         `Transcript words: ${totalTranscriptWords}, Labeled transcript words: ${labeledTranscriptWords} PTokens" ${promptTokens} CTokens: ${completionTokens}`
//       );
//       console.log("Content ", content);
//       console.log("\n--------------------------------------------------\n");
//       // If the labeled transcript has fewer words than the original transcript, we need to continue
//       if (
//         finishReason === "length" ||
//         labeledTranscriptWords < totalTranscriptWords
//       ) {
//         // The response was cut off due to length or the labeled transcript is incomplete
//         console.log(
//           "Response incomplete or cut off due to length, continuing..."
//         );
//         isIncomplete = true; // Continue the loop
//       } else if (
//         finishReason === "stop" &&
//         labeledTranscriptWords >= totalTranscriptWords
//       ) {
//         // The response ended naturally and the word count matches, we're done
//         console.log("Response complete and word counts match.");
//         isIncomplete = false; // Break the loop
//       } else {
//         // Other finish reasons (like content filtering), handle if needed
//         console.log(
//           "Unexpected finish_reason or issue with word count, stopping."
//         );
//         isIncomplete = false; // Exit the loop for safety
//       }
//     }

//     // Return the labeled transcript
//     return {
//       labeledTranscript: completeResponse,
//     };
//   } catch (error) {
//     console.error("Error processing video transcript:", error);
//     return {
//       error: error.message,
//     };
//   }
// }

export async function LabelVideoTranscript(transcript, user, video) {
  const model = "gpt-4-turbo"; // GPT-4 Turbo model
  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const pricePer1000Tokens = 0.03; // $0.03 per 1K tokens for GPT-4 Turbo
  const maxRetries = 5; // Max retries for rate limit errors
  const pauseDuration = 60000; // Pause for 60 seconds in case of rate limit error
  const maxTokensToGenerate = 3500; // Reserve some tokens for the prompt itself

  try {
    // Replace the placeholders in the prompt with actual values
    let kbPrompt = constants.YoutubeLabellingPrompt;
    kbPrompt = kbPrompt.replace(/{creatorname}/g, user.username);
    kbPrompt = kbPrompt.replace(/{titleofvideo}/g, video.title);

    let completeResponse = "";
    let isIncomplete = true;
    let i = 0;
    let retryCount = 0;
    let totalTokensUsed = 0; // Track total tokens used
    let totalCost = 0.0; // Track total cost
    let startPosition = 0; // Keep track of where we are in the transcript

    // Function to count words in a string
    const countWords = (str) =>
      str.split(/\s+/).filter((word) => word.length > 0).length;

    const totalTranscriptWords = countWords(transcript);

    while (isIncomplete) {
      console.log("While loop iteration: ", i);
      i += 1;

      // Get the remaining part of the transcript that still needs labeling
      let remainingTranscript = transcript.substring(startPosition);

      // Limit the remaining transcript we send to 1500 characters (or another appropriate size)
      const transcriptChunk = remainingTranscript.substring(0, 1500);

      // Track the number of tokens used by the prompt
      const promptSize = countWords(kbPrompt) + countWords(transcriptChunk);

      console.log(`Prompt size (words): ${promptSize}`);

      // Construct the messages, limiting how much of the remaining transcript we send
      let messages = [
        {
          role: "system",
          content: kbPrompt, // The system instructions remain the same
        },
        {
          role: "user",
          content: `Continue labeling the transcript from the last point. Here is the next part of the transcript: ${transcriptChunk}`, // Only send a portion of the transcript
        },
      ];

      try {
        const response = await axios.post(
          apiUrl,
          {
            model: model,
            messages: messages,
            max_tokens: maxTokensToGenerate, // Max tokens for generating the response
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
        let content = result.choices[0].message.content.trim();

        // Concatenate to the complete response
        completeResponse += content;

        // Update the startPosition based on the response size
        startPosition += transcriptChunk.length; // Move forward in the transcript

        // Track total tokens used in this iteration
        const tokensUsedInIteration = result.usage.total_tokens;
        totalTokensUsed += tokensUsedInIteration;

        // Calculate the cost for this iteration and add to total cost
        const costForIteration =
          (tokensUsedInIteration / 1000) * pricePer1000Tokens;
        totalCost += costForIteration;

        console.log(`Tokens used in this iteration: ${tokensUsedInIteration}`);
        console.log(`Cost for this iteration: $${costForIteration.toFixed(4)}`);

        // Calculate word count of labeled transcript
        const labeledTranscriptWords = countWords(completeResponse);

        // Check the finish_reason to determine if the response is complete
        const finishReason = result.choices[0].finish_reason;

        console.log("Finish Reason:", content);
        console.log(
          `Transcript words: ${totalTranscriptWords}, Labeled transcript words: ${labeledTranscriptWords}`
        );

        if (
          finishReason === "length" ||
          labeledTranscriptWords < totalTranscriptWords
        ) {
          // The response was cut off due to length or the labeled transcript is incomplete
          console.log(
            "Response incomplete or cut off due to length, continuing..."
          );
          isIncomplete = true; // Continue the loop
        } else if (
          finishReason === "stop" &&
          labeledTranscriptWords >= totalTranscriptWords
        ) {
          // The response ended naturally and the word count matches, we're done
          console.log("Response complete and word counts match.");
          isIncomplete = false; // Break the loop
        } else {
          console.log(
            "Unexpected finish_reason or issue with word count, stopping."
          );
          isIncomplete = false; // Exit the loop for safety
        }
      } catch (error) {
        // Handle rate limiting and other errors
        if (error.response && error.response.status === 429) {
          console.log(
            "Rate limit hit. Pausing for 1 minute before retrying..."
          );
          await new Promise((resolve) => setTimeout(resolve, pauseDuration)); // Pause for 60 seconds
          retryCount++;
          if (retryCount >= maxRetries) {
            console.log("Max retries reached. Stopping...");
            throw new Error("Rate limit exceeded and max retries reached.");
          }
        } else {
          console.error("Error processing video transcript:", error.message);
          throw new Error("Error during labeling process: " + error.message);
        }
      }
    }

    // Output the total tokens and cost
    console.log(`Total tokens used: ${totalTokensUsed}`);
    console.log(`Total cost for labeling transcript: $${totalCost.toFixed(4)}`);

    // Return the labeled transcript and cost
    return {
      labeledTranscript: completeResponse,
      totalTokensUsed,
      totalCost: totalCost.toFixed(4),
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
