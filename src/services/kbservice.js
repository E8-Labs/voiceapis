import axios from "axios";
import db from "../models/index.js";
import { constants } from "../../constants/constants.js";
import { KbTypes } from "../models/ai/kbtype.model.js";
import { CallOpenAi } from "./gptService.js";
import { addToVectorDb } from "./pindeconedb.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MainPointsTypes } from "../models/ai/mainpointstypes.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export function getDataWithUserIdAdded(user, data, kbtype, kbid) {
  const updatedData = data.map((item, index) => {
    return {
      ...item, // Spread the existing user object
      userId: user.id, // Add a new key 'userId' with a value (you can customize this)
      kbType: kbtype,
      kbId: kbid,
    };
  });
  return updatedData;
}

export async function AddPersonalBeliefsAndValue(json, user, kbtype, kbid) {
  let traits = json.PersonaCharacteristics.PersonalValues;

  const updatedTraits = getDataWithUserIdAdded(user, traits, kbtype, kbid);

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
  const updatedBeliefs = getDataWithUserIdAdded(user, beliefs, kbtype, kbid);

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

export async function AddTraits(json, user, kbtype, kbid) {
  let traits = json.PersonaCharacteristics.PersonalityTraits;
  const updatedTraits = getDataWithUserIdAdded(user, traits, kbtype, kbid);

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
export async function AddFrameworks(json, user, kbtype, kbid) {
  let traits = json.Communication.FrameworksAndTechniques;
  const updatedTraits = getDataWithUserIdAdded(user, traits, kbtype, kbid);

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

export async function AddIntractionExample(json, user, kbtype, kbid) {
  let traits = json.Communication.InteractionExamples;
  const updatedTraits = getDataWithUserIdAdded(user, traits, kbtype, kbid);

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

export async function AddCommunicationInstructions(json, user, kbtype, kbid) {
  let traits = json.Communication.CommunicationInstructions;
  let t = traits.map((item) => {
    return {
      pacing: item.pacing,
      tone: item.tone,
      intonation: item.intonation,
      scenario: item.sample.scenario,
      prompt: item.sample.prompt,
      response: item.sample.response,
    };
  });
  const updatedTraits = getDataWithUserIdAdded(user, t, kbtype, kbid);

  console.log("Communication Instructions  ", updatedTraits);
  if (updatedTraits) {
    try {
      // Use await with bulkCreate to insert the users
      await db.CommunicationInstructions.bulkCreate(updatedTraits, {
        updateOnDuplicate: ["title"],
      });
      console.log("Instruction Ex added successfully!");
    } catch (error) {
      console.error("Error inserting users:", error);
    }
  } else {
    console.log("No Instruction Ex found");
  }
}

export async function AddPhrasesAndQuotes(json, user, kbtype, kbid) {
  let traits = json.Communication.ShortPhrases;
  const updatedTraits = getDataWithUserIdAdded(user, traits, kbtype, kbid);

  console.log("ShortPhrases  ", updatedTraits);
  if (updatedTraits) {
    try {
      // Use await with bulkCreate to insert the users
      await db.PhrasesAndQuotes.bulkCreate(updatedTraits, {
        updateOnDuplicate: ["title"],
      });
      console.log("ShortPhrases Ex added successfully!");
    } catch (error) {
      console.error("Error inserting ShortPhrases:", error);
    }
  } else {
    console.log("No ShortPhrases Ex found");
  }
}

export async function AddObjectionHandling(json, user, kbtype, kbid) {
  let traits = json.ObjectionHandling;
  const updatedTraits = getDataWithUserIdAdded(user, traits, kbtype, kbid);

  console.log("ObjectionHandling  ", updatedTraits);
  if (updatedTraits) {
    try {
      // Use await with bulkCreate to insert the users
      await db.ObjectionHandling.bulkCreate(updatedTraits, {
        updateOnDuplicate: ["objectionType"],
      });
      console.log("ObjectionHandling Ex added successfully!");
    } catch (error) {
      console.error("Error inserting ObjectionHandling:", error);
    }
  } else {
    console.log("No ObjectionHandling Ex found");
  }
}

export async function AddCallStrategy(json, user, kbtype, kbid) {
  let traits = json.CallStrategy;
  const updatedTraits = getDataWithUserIdAdded(user, traits, kbtype, kbid);

  console.log("ObjectionHandling  ", updatedTraits);
  if (updatedTraits) {
    try {
      // Use await with bulkCreate to insert the users
      await db.CallStrategy.bulkCreate(updatedTraits, {
        updateOnDuplicate: ["title"],
      });
      console.log("CallStrategy Ex added successfully!");
    } catch (error) {
      console.error("Error inserting CallStrategy:", error);
    }
  } else {
    console.log("No CallStrategy Ex found");
  }
}

export async function AddUserPhilosophyAndViews(json, user, kbtype, kbid) {
  let traits = json.PersonaCharacteristics.PhilosophyAndViews;
  const updatedTraits = getDataWithUserIdAdded(user, traits, kbtype, kbid);

  console.log("PhilosophyAndViews  ", updatedTraits);
  if (updatedTraits) {
    try {
      // Use await with bulkCreate to insert the users
      await db.UserPhilosophyAndViews.bulkCreate(updatedTraits, {
        updateOnDuplicate: ["title"],
      });
      console.log("PhilosophyAndViews Ex added successfully!");
    } catch (error) {
      console.error("Error inserting PhilosophyAndViews:", error);
    }
  } else {
    console.log("No PhilosophyAndViews Ex found");
  }
}

export function getDataWithUserIdAddedMainPoints(
  user,
  data,
  kbtype,
  kbid,
  type
) {
  const updatedData = data.map((item, index) => {
    return {
      ...item, // Spread the existing user object
      userId: user.id, // Add a new key 'userId' with a value (you can customize this)
      kbType: kbtype,
      kbId: kbid,
      type: type,
    };
  });
  return updatedData;
}

export async function AddMainPoints(json, user, kbtype, kbid) {
  try {
    let traits = json.AdditionalContent.MainPoints;
    const updatedTraits = getDataWithUserIdAddedMainPoints(
      user,
      traits,
      kbtype,
      kbid,
      MainPointsTypes.MainPoints
    );

    console.log("MainPoints  ", updatedTraits);
    await db.MainPoints.bulkCreate(updatedTraits, {
      updateOnDuplicate: ["title"],
    });
    console.log("MainPoints Ex added successfully!");
  } catch (error) {
    console.error("Error inserting MainPoints:", error);
  }

  try {
    let traits = json.AdditionalContent.Lessons;
    const updatedTraits = getDataWithUserIdAddedMainPoints(
      user,
      traits,
      kbtype,
      kbid,
      MainPointsTypes.Lessons
    );
    console.log("Lessons  ", updatedTraits);
    await db.MainPoints.bulkCreate(updatedTraits, {
      updateOnDuplicate: ["title"],
    });
    console.log("Lessons Ex added successfully!");
  } catch (error) {
    console.error("Error inserting Lessons:", error);
  }

  try {
    let traits = json.AdditionalContent.KeyTopics;
    const updatedTraits = getDataWithUserIdAddedMainPoints(
      user,
      traits,
      kbtype,
      kbid,
      MainPointsTypes.KeyTopics
    );
    console.log("KeyTopics  ", updatedTraits);
    await db.MainPoints.bulkCreate(updatedTraits, {
      updateOnDuplicate: ["title"],
    });
    console.log("KeyTopics Ex added successfully!");
  } catch (error) {
    console.error("Error inserting KeyTopics:", error);
  }

  try {
    let traits = json.AdditionalContent.KeyMessage;
    const updatedTraits = getDataWithUserIdAddedMainPoints(
      user,
      traits,
      kbtype,
      kbid,
      MainPointsTypes.KeyMessages
    );
    console.log("KeyMessages  ", updatedTraits);
    await db.MainPoints.bulkCreate(updatedTraits, {
      updateOnDuplicate: ["title"],
    });
    console.log("KeyMessages Ex added successfully!");
  } catch (error) {
    console.error("Error inserting KeyMessages:", error);
  }

  try {
    let traits = json.AdditionalContent.SpeakersPerspective;
    const updatedTraits = getDataWithUserIdAddedMainPoints(
      user,
      traits,
      kbtype,
      kbid,
      MainPointsTypes.SpeakersPerspective
    );
    console.log("SpeakersPerspective  ", updatedTraits);
    await db.MainPoints.bulkCreate(updatedTraits, {
      updateOnDuplicate: ["title"],
    });
    console.log("SpeakersPerspective Ex added successfully!");
  } catch (error) {
    console.error("Error inserting SpeakersPerspective:", error);
  }

  try {
    let traits = json.AdditionalContent.CommonQuestions;
    const updatedTraits = getDataWithUserIdAddedMainPoints(
      user,
      traits,
      kbtype,
      kbid,
      MainPointsTypes.CommonQuestions
    );
    console.log("CommonQuestions  ", updatedTraits);
    await db.MainPoints.bulkCreate(updatedTraits, {
      updateOnDuplicate: ["title"],
    });
    console.log("CommonQuestions Ex added successfully!");
  } catch (error) {
    console.error("Error inserting CommonQuestions:", error);
  }

  try {
    let traits = json.AdditionalContent.PersonalStories;
    const updatedTraits = getDataWithUserIdAddedMainPoints(
      user,
      traits,
      kbtype,
      kbid,
      MainPointsTypes.PersonalStories
    );
    console.log("PersonalStories  ", updatedTraits);
    await db.MainPoints.bulkCreate(updatedTraits, {
      updateOnDuplicate: ["title"],
    });
    console.log("PersonalStories Ex added successfully!");
  } catch (error) {
    console.error("Error inserting PersonalStories:", error);
  }
}

export async function AddAllData(json, user, kbtype = "", kbid = null) {
  console.log("Json to add ", json);

  await AddMainPoints(json, user, kbtype, kbid);
  try {
    console.log("Adding Traits");
    await AddTraits(json, user, kbtype, kbid);
  } catch (error) {
    console.log("Error Adding Traits", error);
  }
  try {
    console.log("Adding Frameworks");
    await AddFrameworks(json, user, kbtype, kbid);
  } catch (error) {
    console.log("Error Adding Frame", error);
  }
  try {
    console.log("Adding Beliefs");
    await AddPersonalBeliefsAndValue(json, user, kbtype, kbid);
  } catch (error) {
    console.log("Error Adding Beliefs And Values", error);
  }
  try {
    console.log("Adding Intractions");
    await AddIntractionExample(json, user, kbtype, kbid);
  } catch (error) {
    console.log("Error Adding Intractions", error);
  }
  try {
    console.log("Adding Com Instruc");
    await AddCommunicationInstructions(json, user), kbtype, kbid;
  } catch (error) {
    console.log("Error Adding Com Instr", error);
  }
  try {
    console.log("Adding Phrases");
    await AddPhrasesAndQuotes(json, user, kbtype, kbid);
  } catch (error) {
    console.log("Error Adding Phrases", error);
  }
  try {
    console.log("Adding UserPhilosophyAndViews");
    await AddUserPhilosophyAndViews(json, user, kbtype, kbid);
  } catch (error) {
    console.log("Error Adding UserPhilosophyAndViews", error);
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
  let transcript = video.caption || "";
  if (transcript == "error") {
    return;
  }

  if (transcript == null || transcript == "") {
    console.log("Dont have transcript. Fetching New");
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://www.searchapi.io/api/v1/search?api_key=${process.env.YoutubeSearchApiKey}&engine=youtube_transcripts&video_id=${videoId}`,
      headers: {
        Authorization: `Bearer ${process.env.YoutubeSearchApiKey}`,
      },
      data: data,
    };

    let response = await axios.request(config);
    let resData = response.data;
    if (resData.error) {
      video.caption = "error";
      let saved = await video.save();

      return;
    } else {
      // continue
    }
    console.log("Fetched Transcript");

    resData.transcripts.map((t) => {
      transcript += t.text ? t.text : "";
    });
  } else {
    console.log("Already have transcript. Using that.");
  }

  console.log("Fetching Summary", videoId);

  //add the transcript to vdb
  let trans = transcript;
  if (trans == null || trans == "") {
    return;
  }
  // if (video.LabeledTranscript) {
  //   trans = video.LabeledTranscript;
  // }
  let summary = await processVideoTranscript(trans, user, video);

  try {
    let json = JSON.parse(summary.summary);
    video.summary = summary.summary || "";
    let saved1 = await video.save();
    let metaData = null;
    if (json) {
      try {
        const metaData = {
          MainPoints: JSON.stringify(json.AdditionalContent?.MainPoints ?? ""),
          KeyTopics: JSON.stringify(json.AdditionalContent?.KeyTopics ?? ""),
          FrameworksModels: JSON.stringify(
            json.AdditionalContent?.FrameworksModels ?? ""
          ),
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
        await AddAllData(json, user, "video", video?.id ?? null);
      } catch (error) {
        console.log("error while scraping data from json");
        console.log(error);
      }
    }
  } catch (error) {
    console.log("Error parsing json");
    console.log(error);
    return;
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
    let postBody = JSON.stringify({
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
    });
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AIKey}`,
      },
      body: postBody,
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

    await db.GptCost.create({
      userId: user.id,
      itemId: video.id,
      cost: cost || 0,
      input: postBody,
      output: content,
      type: "Cron:ProcessVideoTranscript",
    });
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

// Utility function to check and auto-fix common JSON formatting issues
function fixMalformedJson(jsonString) {
  try {
    return JSON.parse(jsonString); // First attempt to parse as-is
  } catch (error) {
    // Handle common JSON issues
    console.log("Malformed JSON detected. Attempting to fix...");

    // Try to fix common issues like missing commas or closing braces
    jsonString = jsonString
      .replace(/}\s*{/g, "},{") // Fix cases of missing commas between objects
      .replace(/,\s*]}/g, "]}") // Remove extra commas before closing brackets
      .replace(/,\s*}/g, "}"); // Remove extra commas before closing braces

    // Check for proper closing braces or brackets
    let openBrackets = (jsonString.match(/{/g) || []).length;
    let closeBrackets = (jsonString.match(/}/g) || []).length;
    if (openBrackets > closeBrackets) {
      jsonString += "}".repeat(openBrackets - closeBrackets); // Add missing closing braces
    }

    let openArrayBrackets = (jsonString.match(/\[/g) || []).length;
    let closeArrayBrackets = (jsonString.match(/]/g) || []).length;
    if (openArrayBrackets > closeArrayBrackets) {
      jsonString += "]".repeat(openArrayBrackets - closeArrayBrackets); // Add missing closing array brackets
    }

    // Retry parsing after fixing common issues
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Failed to auto-fix JSON:", error.message);
      return null; // Return null if unable to fix
    }
  }
}

// Main function to process and merge JSON chunks
export async function ProcessDocumentAndTextKb() {
  console.log("Kb processing start cron");
  let kbs = await db.KnowledgeBase.findAll({
    where: {
      processed: false,
    },
  });

  if (kbs && kbs.length > 0) {
    console.log("Found Kb ", kbs.length);
    for (let i = 0; i < kbs.length; i++) {
      let kb = kbs[i];
      let user = await db.User.findByPk(kb.userId);
      let kbPrompt = constants.KBPrompt;

      let type = kb.type;
      if (type == KbTypes.Document) {
        kbPrompt = kbPrompt.replace(/{document_name}/g, kb.name || "Document");
        kbPrompt = kbPrompt.replace(/{creatorname}/g, user.username || "User");
        kbPrompt = kbPrompt.replace(
          /{document_description}/g,
          kb.description || "No description"
        );
      } else if (type == KbTypes.Text) {
        if (kb.content == null || kb.content == "") {
          kb.processed = true;
          await kb.save();
          return;
        }
        kbPrompt = constants.TextPrompt;
        kbPrompt = kbPrompt.replace(
          /{text_description}/g,
          kb.description || ""
        );
        kbPrompt = kbPrompt.replace(/{creatorname}/g, user.username || "User");
        kbPrompt = kbPrompt.replace(/{pasted_text}/g, kb.content || "no text");
      }

      console.log("Starting processing for Kb:", kb.name || "Unnamed KB");

      // Convert content into words array
      let words = kb.content.split(/\s+/); // Split by spaces into words
      let wordChunkSize = 5000; // Chunk size based on word count
      let chunks = [];
      let processedData = [];
      let totalCost = 0;

      // Split content into word-based chunks
      for (let start = 0; start < words.length; start += wordChunkSize) {
        chunks.push(words.slice(start, start + wordChunkSize).join(" ")); // Create a chunk with 6000 words
      }

      // Process each chunk with OpenAI API and collect responses
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        let chunkContent = chunks[chunkIndex];
        let kbPromptIteration = kbPrompt.replace(
          /{document_text}/g,
          chunkContent
        );
        if (kb.type == KbTypes.Text) {
          kbPromptIteration = kbPrompt.replace(/{pasted_text}/g, chunkContent);
        }

        let result = await CallOpenAi(kbPromptIteration);
        if (result.status) {
          totalCost += result.cost || 0;
          let content = result.message;
          content = content.replace(new RegExp("```json", "g"), "");
          content = content.replace(new RegExp("```", "g"), "");
          content = content.replace(new RegExp("\n", "g"), "");

          console.log(`Json for chunk ${chunkIndex} : `, content);

          // Validate and fix malformed JSON before writing it to a file
          let fixedJson = fixMalformedJson(content);

          if (fixedJson) {
            processedData.push(fixedJson); // Collect the parsed JSON data from each chunk
            console.log("Processed chunk", chunkIndex + 1, "of", chunks.length);
          } else {
            console.log("Failed to process chunk due to malformed JSON.");
            continue; // Move on to the next chunk
          }
        } else {
          console.log(
            "Kb processing error on chunk",
            chunkIndex + 1,
            result.error
          );
          break; // Exit on OpenAI API failure
        }
      }

      // If all chunks are processed successfully, merge the results
      if (processedData.length === chunks.length) {
        console.log("All chunks processed successfully, merging data...");

        // Merge all the JSON objects from different chunks
        let unifiedJson = mergeAllJsonChunks(processedData);

        // Optionally store this unified JSON data
        kb.processedData = JSON.stringify(unifiedJson);
        kb.processed = true;
        await kb.save();

        // Handle metadata (you can customize based on your requirements)
        let metaData = {
          MainPoints: unifiedJson.AdditionalContent?.MainPoints ?? [],
          KeyTopics: unifiedJson.AdditionalContent?.KeyTopics ?? [],
          FrameworksModels:
            unifiedJson.AdditionalContent?.FrameworksModels ?? [],
          documentDbId: kb?.id ?? "",
          documentTitle: kb?.name ?? "",
        };

        if (!kb.addedToDb) {
          let added = await addToVectorDb(
            kb.content,
            user,
            "Document",
            metaData
          );
          if (added) {
            console.log("Added to vector db");
            kb.addedToDb = true;
            await kb.save();
          }
        } else {
          console.log("Already added to vdb");
        }

        await AddAllData(unifiedJson, user, "kb", kb.id); // Optionally add all data

        await db.GptCost.create({
          userId: user.id,
          itemId: kb.id,
          cost: totalCost,
          input: `Chunks- ${chunks.length} \nContent: ${kb.content}`,
          output: JSON.stringify(unifiedJson),
          type: "Cron:ProcessDocumentKb",
        });
        await db.AIProfile.create({
          userId: kb.userId,
          profileData: JSON.stringify(unifiedJson),
        });

        console.log("Kb updated and fully processed", unifiedJson);
      } else {
        console.log("Could not fully process all chunks.");
      }
    }
  } else {
    console.log("No Kbs to process");
  }
}

// Function to merge all JSON chunks
function mergeAllJsonChunks(chunks) {
  let finalJson = {};

  // Iterate through all chunks and merge them
  for (let i = 0; i < chunks.length; i++) {
    finalJson = mergeJsonChunks(finalJson, chunks[i]);
  }

  return finalJson;
}

// Function to attempt JSON parsing with fallback for partial/malformed JSON
function tryParseJson(str) {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.log("JSON parse error:", error.message);
    // Attempt to fix or handle incomplete JSON here if possible
    // Example: detect if a JSON object is incomplete and continue parsing later
    return null; // Return null if unable to parse
  }
}

// Function to merge two JSON objects (for merging chunk responses)
function mergeJsonChunks(chunk1, chunk2) {
  let merged = { ...chunk1 };

  for (let key in chunk2) {
    if (chunk2.hasOwnProperty(key)) {
      if (Array.isArray(chunk2[key])) {
        // Merge arrays by concatenating
        merged[key] = (merged[key] || []).concat(chunk2[key]);
      } else if (typeof chunk2[key] === "object" && chunk2[key] !== null) {
        // Recursively merge objects
        merged[key] = mergeJsonChunks(merged[key] || {}, chunk2[key]);
      } else {
        // Override primitive values
        merged[key] = chunk2[key];
      }
    }
  }

  return merged;
}
