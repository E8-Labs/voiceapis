import axios from "axios";
import { constants } from "../../constants/constants.js";
import { KbTypes } from "../models/ai/kbtype.model.js";
import { CallOpenAi } from "./gptService.js";
import { addToVectorDb } from "./pindeconedb.js";

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

export function getDataWithUserIdAdded(user, data) {
  const updatedData = data.map((item, index) => {
    return {
      ...item, // Spread the existing user object
      userId: user.id, // Add a new key 'userId' with a value (you can customize this)
    };
  });
  return updatedData;
}

export async function AddPersonalBeliefsAndValue(json, user) {
  let traits = json.PersonaCharacteristics.PersonalValues;

  const updatedTraits = getDataWithUserIdAdded(user, traits);

  console.log("Personal Value ", updatedTraits);
  if (updatedTraits) {
    try {
      // Use await with bulkCreate to insert the users
      await db.UserValues.bulkCreate(updatedTraits, {
        updateOnDuplicate: ["title"],
      });
      console.log("Values added successfully!");
    } catch (error) {
      console.error("Error inserting users:", error);
    }
  } else {
    console.log("No Values found");
  }

  let beliefs = json.PersonaCharacteristics.PersonalBeliefs;
  const updatedBeliefs = getDataWithUserIdAdded(user, beliefs);

  console.log("Personal Value ", updatedBeliefs);
  if (updatedBeliefs) {
    try {
      // Use await with bulkCreate to insert the users
      await db.UserBeliefs.bulkCreate(updatedBeliefs, {
        updateOnDuplicate: ["title"],
      });
      console.log("Beliefs added successfully!");
    } catch (error) {
      console.error("Error inserting users:", error);
    }
  } else {
    console.log("No Beliefs found");
  }
}

export async function AddTraits(json, user) {
  let traits = json.PersonaCharacteristics.PersonalityTraits;
  const updatedTraits = getDataWithUserIdAdded(user, traits);

  console.log("Personality Traits ", updatedTraits);
  if (updatedTraits) {
    try {
      // Use await with bulkCreate to insert the users
      await db.PersonalityTrait.bulkCreate(updatedTraits, {
        updateOnDuplicate: ["trait"],
      });
      console.log("Traits added successfully!");
    } catch (error) {
      console.error("Error inserting users:", error);
    }
  } else {
    console.log("No traits found");
  }
}
export async function AddFrameworks(json, user) {
  let traits = json.Communication.FrameworksAndTechniques;
  const updatedTraits = getDataWithUserIdAdded(user, traits);

  console.log("Personality Traits ", updatedTraits);
  if (updatedTraits) {
    try {
      // Use await with bulkCreate to insert the users
      await db.FrameworkAndTechnique.bulkCreate(updatedTraits, {
        updateOnDuplicate: ["title"],
      });
      console.log("Frameworks added successfully!");
    } catch (error) {
      console.error("Error inserting users:", error);
    }
  } else {
    console.log("No Frameworks found");
  }
}

export async function AddIntractionExample(json, user) {
  let traits = json.Communication.InteractionExamples;
  const updatedTraits = getDataWithUserIdAdded(user, traits);

  console.log("Intraction Examples ", updatedTraits);
  if (updatedTraits) {
    try {
      // Use await with bulkCreate to insert the users
      await db.IntractionExample.bulkCreate(updatedTraits, {
        updateOnDuplicate: ["question"],
      });
      console.log("Intraction Ex added successfully!");
    } catch (error) {
      console.error("Error inserting users:", error);
    }
  } else {
    console.log("No Intraction Ex found");
  }
}

export async function AddAllData(json, user) {
  console.log("Json to add ", json);
  try {
    console.log("Adding Traits");
    await AddTraits(json, user);
  } catch (error) {
    console.log("Error Adding Traits", error);
  }
  try {
    console.log("Adding Frameworks");
    await AddFrameworks(json, user);
  } catch (error) {
    console.log("Error Adding Frame", error);
  }
  try {
    console.log("Adding Beliefs");
    await AddPersonalBeliefsAndValue(json, user);
  } catch (error) {
    console.log("Error Adding Beliefs And Values", error);
  }
  try {
    console.log("Adding Intractions");
    await AddIntractionExample(json, user);
  } catch (error) {
    console.log("Error Adding Intractions", error);
  }
}

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

//Youtube Video Transcripts
export const fetchVideoCaptionsAndProcessWithPrompt = async (
  videoId,
  user,
  video
) => {
  let data = "";

  console.log("Fetching Transcript", user.id);
  // return;
  let transcript = video.caption;
  if (transcript == null || transcript == "") {
    console.log("Dont have transcript. Fetching New");
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://www.searchapi.io/api/v1/search?api_key=cYNn3AVjaS2eVN9yz75YbCCf&engine=youtube_transcripts&video_id=${videoId}`,
      headers: {
        Authorization: "Bearer cYNn3AVjaS2eVN9yz75YbCCf",
      },
      data: data,
    };

    let response = await axios.request(config);
    let resData = response.data;
    // console.log("Fetched Transcript", response);

    resData.transcripts.map((t) => {
      transcript += t.text;
    });
  } else {
    console.log("Already have transcript. Using that.");
  }

  console.log("Fetching Summary", videoId);

  //add the transcript to vdb
  let trans = transcript;
  // if (video.LabeledTranscript) {
  //   trans = video.LabeledTranscript;
  // }
  let summary = await processVideoTranscript(trans, user, video);
  video.summary = summary.summary || "";
  let saved1 = await video.save();
  try {
    let json = JSON.parse(summary.summary);
    let metaData = null;
    if (json) {
      try {
        const metaData = {
          MainPoints: json.AdditionalContent?.MainPoints ?? "",
          KeyTopics: json.AdditionalContent?.KeyTopics ?? "",
          FrameworksModels: json.AdditionalContent?.FrameworksModels ?? "",
          videoDbId: video?.id ?? "",
          videoTitle: video?.title ?? "",
        };
        if (!video.addedToDb) {
          let added = await addToVectorDb(
            transcript, //json.LabeledTranscript,
            user,
            "youtube",
            metaData
          );
          if (added) {
            console.log("Added to vector db");
            video.addedToDb = true;
            // return res.send({ message: "Added", status: true, data: added });
          }
        } else {
          console.log("Already added to vdb");
        }
        //add the personality traits to the db table
        await AddAllData(json, user);
      } catch (error) {
        console.log("error while scraping data from json");
        console.log(error);
      }
    }
  } catch (error) {
    console.log("Error parsing json");
    console.log(error);
  }

  video.caption = transcript;

  video.tokensUsed = summary.tokensUsed || 0;
  video.cost = summary.cost || 0;
  let saved = await video.save();
  // console.log("Fetched Summary", summary.summary);
  //Summarize here
};

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

//Document And Text Processing
export async function ProcessDocumentAndTextKb() {
  console.log("Kb processing start cron");
  let kbs = await db.KnowledgeBase.findAll({
    where: {
      processed: false,
    },
  });

  if (kbs) {
    console.log("Found Kb ", kbs.length);
    for (let i = 0; i < kbs.length; i++) {
      let kb = kbs[i];

      let user = await db.User.findByPk(kb.userId);
      let kbPrompt = constants.KBPrompt;

      let type = kb.type;
      if (type == KbTypes.Document) {
        kbPrompt = kbPrompt.replace(/{document_name}/g, kb.name);
        kbPrompt = kbPrompt.replace(/{creatorname}/g, user.username);
        kbPrompt = kbPrompt.replace(/{document_description}/g, kb.description);
        kbPrompt = kbPrompt.replace(/{document_text}/g, kb.content); //document_text
      }

      let result = await CallOpenAi(prompt);
      if (result.status) {
        let content = result.message;
        content = content.replace(new RegExp("```json", "g"), "");
        content = content.replace(new RegExp("```", "g"), "");
        content = content.replace(new RegExp("\n", "g"), "");
        kb.processedData = content;
        kb.processed = true;
        let saved = await kb.save();
        try {
          let json = JSON.parse(content);
          let metaData = null;
          if (json) {
            try {
              const metaData = {
                MainPoints: json.AdditionalContent?.MainPoints ?? "",
                KeyTopics: json.AdditionalContent?.KeyTopics ?? "",
                FrameworksModels:
                  json.AdditionalContent?.FrameworksModels ?? "",
                documentDbId: kb?.id ?? "",
                documentTitle: kb?.name ?? "",
              };
              if (!kb.addedToDb) {
                let added = await addToVectorDb(
                  transcript, //json.LabeledTranscript,
                  user,
                  "Document",
                  metaData
                );
                if (added) {
                  console.log("Added to vector db");
                  kb.addedToDb = true;
                  await kb.save();
                  // return res.send({ message: "Added", status: true, data: added });
                }
              } else {
                console.log("Already added to vdb");
              }
              //add the personality traits to the db table
              await AddAllData(json, user);
            } catch (error) {
              console.log("error while scraping data from json");
              console.log(error);
            }
          }
        } catch (error) {
          console.log("Error parsing json");
          console.log(error);
        }
        let aiProfile = await db.AIProfile.create({
          userId: kb.userId,
          profileData: content,
        });
        console.log("Kb updated and processed", content);
      } else {
        console.log("Kb processing error", result.error);
      }
    }
  } else {
    console.log("No Kbs to process");
  }
}
