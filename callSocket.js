import Fastify from "fastify";
import WebSocket from "ws";
import fs from "fs";
import dotenv from "dotenv";
import fastifyFormBody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
// import { Constants } from "./constants.js";
import { findVectorData } from "./src/services/pindeconedb.js";
import db from "./src/models/index.js";

// Load environment variables from .env file
dotenv.config();

// Retrieve the OpenAI API key from environment variables. You must have OpenAI Realtime API access.
const { OPENAI_API_KEY } = process.env;

if (!OPENAI_API_KEY) {
  console.error("Missing OpenAI API key. Please set it in the .env file.");
  process.exit(1);
}

// Initialize Fastify
const fastify = Fastify();
fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

// Constants
const SYSTEM_MESSAGE = `
Your objective is to emulate Andrew Tate’s persona as callers reach out for general conversation, discussing a wide range of topics from everyday life, current events, random thoughts, or more serious topics like success, mindset, and self-improvement. As Andrew Tate, you’re dynamic—sometimes laid-back and engaging, other times confrontational and challenging, depending on the conversation. Allow the conversation to flow naturally while maintaining Tate’s trademark provocative, direct, and often rude tone. Adapt to the caller’s topic, but stay true to Tate’s no-nonsense personality. Only when the conversation demands it, switch to hard-hitting advice and guidance, focusing on pushing the caller towards action and success.

If the user asks any question related to life, dating, masculaity, being a man or any general topci or details about a specific topic , you should call the "getKnowledgebase" function with their question.

Greet the user by "Who the fuck is calling this number".
Personality Traits:
- Confident & Provocative: Always speak with certainty, but adapt your intensity based on the topic. Whether the conversation is about a serious issue or something more casual, keep the provocative edge alive.
- Flexible & Dynamic: Adjust to the tone of the conversation. Engage in more relaxed conversations, banter, or give hot takes on random topics when needed. When the opportunity arises, switch to confrontational and motivational advice.
- Unfiltered: No matter the topic, stay true to the unfiltered, direct style. Be rude or confrontational when needed, but also use humor or sarcasm to keep things light when appropriate.
...
`;

const VOICE = "alloy";
const PORT = process.env.PORT || 2020; // Allow dynamic port assignment

// List of Event Types to log to the console. See OpenAI Realtime API Documentation. (session.updated is handled separately.)
const LOG_EVENT_TYPES = [
  "response.content.done",
  "rate_limits.updated",
  "response.done",
  "input_audio_buffer.committed",
  "input_audio_buffer.speech_stopped",
  "input_audio_buffer.speech_started",
  "session.created",
];

const sendSessionUpdate = (openAiWs) => {
  const sessionUpdate = {
    type: "session.update",
    session: {
      turn_detection: { type: "server_vad" },
      input_audio_format: "g711_ulaw",
      output_audio_format: "g711_ulaw",
      voice: VOICE,
      instructions: SYSTEM_MESSAGE,
      modalities: ["text", "audio"],
      temperature: 0.6,
      // Define the functions OpenAI can call
      tools: [
        {
          name: "getKnowledgebase", // The name that OpenAI will use to call the function
          description:
            "Retrieve knowledgebase content whenever user asks any question",
          type: "function",
          parameters: {
            type: "object",
            properties: {
              user_question: {
                type: "string",
                description:
                  "A question that should be used to search or filter the knowledgebase.",
              },
            },
            required: ["user_question"],
          },
        },
      ],
    },
  };

  console.log("Sending session update:", JSON.stringify(sessionUpdate));
  openAiWs.send(JSON.stringify(sessionUpdate));
};

// Root Route
fastify.get("/", async (request, reply) => {
  reply.send({ message: "Twilio Media Stream Server is running!" });
});

// Route for Twilio to handle incoming and outgoing calls
// <Say> punctuation to improve text-to-speech translation
fastify.all("/incoming-call", async (request, reply) => {
  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
                          <Response>
                              <Pause length="1"/>
                              <Say>O.K. you can start talking!</Say>
                              <Connect>
                                  <Stream url="wss://${request.headers.host}/media-stream" />
                              </Connect>
                          </Response>`;

  reply.type("text/xml").send(twimlResponse);
});

// WebSocket route for media-stream
fastify.register(async (fastify) => {
  fastify.get("/media-stream", { websocket: true }, (connection, req) => {
    console.log("Client connected");

    const openAiWs = new WebSocket(
      "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "realtime=v1",
        },
      }
    );

    let streamSid = null;

    // Open event for OpenAI WebSocket
    openAiWs.on("open", () => {
      console.log("Connected to the OpenAI Realtime API");
      setTimeout(() => {
        sendSessionUpdate(openAiWs);
      }, 250); // Ensure connection stability, send after .25 seconds
    });

    // Listen for messages from the OpenAI WebSocket (and send to Twilio if necessary)
    // Listen for messages from OpenAI WebSocket (including function triggers)
    let functionCallArgsBuffer = "";
    let callId = "";
    openAiWs.on("message", async (data) => {
      try {
        const response = JSON.parse(data);
        // console.log("New AI Message", response.type);
        if (response.type == "error") {
          console.log("Error ");
          console.log(response);
        }
        if (response.content) {
          console.log("Text is ", response.content.text);
        }
        if (LOG_EVENT_TYPES.includes(response.type)) {
          console.log(`Received event: ${response.type}`);
        }

        // Check if OpenAI wants to trigger a function

        if (
          response.type === "response.function_call_arguments.delta" &&
          response.delta
        ) {
          // Accumulate the incoming delta into the buffer
          functionCallArgsBuffer += response.delta;
          // Extract the call_id if it exists
          if (response.call_id) {
            callId = response.call_id; // Store the call_id for use when sending the output
          }
        } else if (response.type === "response.function_call_arguments.done") {
          // When the argument is done, parse the accumulated buffer as JSON
          console.log("Function Call Argument Done", functionCallArgsBuffer);
          try {
            const functionArgs = JSON.parse(functionCallArgsBuffer);

            // Reset the buffer
            functionCallArgsBuffer = "";

            // Process the function call
            // if (functionArgs.name === "getKnowledgebase") {
            const result = await getContext(functionArgs.user_question); // Call your function with the parsed arguments
            console.log("Function result:", result);
            console.log("Function Call Id ", callId);
            // Send the result back to OpenAI as function_call_output
            const functionResultMessage = {
              type: "conversation.item.create", // This is the correct event to send
              item: {
                type: "function_call_output", // Mark it as a function call output
                output: result || "No comment please",
                call_id: callId,
              },
            };

            // Send the message back to OpenAI
            openAiWs.send(JSON.stringify(functionResultMessage));
            // }
          } catch (parseError) {
            console.error("Error parsing function call arguments:", parseError);
          }
        }

        if (response.type === "session.updated") {
          console.log("Session updated successfully:", response);
        }

        if (response.type === "response.audio.delta" && response.delta) {
          const audioDelta = {
            event: "media",
            streamSid: streamSid,
            media: {
              payload: Buffer.from(response.delta, "base64").toString("base64"),
            },
          };
          connection.send(JSON.stringify(audioDelta));
        }
      } catch (error) {
        console.error(
          "Error processing OpenAI message:",
          error,
          "Raw message:",
          data
        );
      }
    });

    // Handle incoming messages from Twilio
    connection.on("message", (message) => {
      try {
        const data = JSON.parse(message);

        switch (data.event) {
          case "media":
            if (openAiWs.readyState === WebSocket.OPEN) {
              const audioAppend = {
                type: "input_audio_buffer.append",
                audio: data.media.payload,
              };

              openAiWs.send(JSON.stringify(audioAppend));
            }
            break;
          case "start":
            streamSid = data.start.streamSid;
            console.log("Incoming stream has started", streamSid);
            break;
          default:
            console.log("Received non-media event:", data.event);
            break;
        }
      } catch (error) {
        console.error("Error parsing message:", error, "Message:", message);
      }
    });

    // Handle connection close
    connection.on("close", () => {
      if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
      console.log("Client disconnected.");
    });

    // Handle WebSocket close and errors
    openAiWs.on("close", () => {
      console.log("Disconnected from the OpenAI Realtime API");
    });

    openAiWs.on("error", (error) => {
      console.error("Error in the OpenAI WebSocket:", error);
    });
  });
});

fastify.post("/call-status", async (request, reply) => {
  const callSid = request.body.CallSid;
  const callStatus = request.body.CallStatus;

  console.log(`Call SID: ${callSid} is now ${callStatus}`);

  // Store or update the status in your database or application
  reply.status(200).send();
});

fastify.listen({ port: PORT }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server is listening on port ${PORT}`);
});

async function getContext(query) {
  // findVectorData
  let user = await db.User.findByPk(6);
  let rawContext = await findVectorData(query, user, "kb-index-transcript");
  let answer = await callOpenAi(query, rawContext);
  return answer;
}

async function callOpenAi(message, data) {
  const model = "gpt-4o"; // You specified gpt-4, or it can be "gpt-4-turbo"
  const apiUrl = "https://api.openai.com/v1/chat/completions";

  try {
    // Make the request to the OpenAI API
    let messages = [
      { role: "system", content: data },
      {
        role: "system",
        content: SYSTEM_MESSAGE,
      },
      { role: "user", content: message },
    ];
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AIKey}`,
      },

      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 1000, // Limit the number of tokens for the response (adjust as needed)
      }),
    });

    // Parse the response
    const result = await response.json();

    // Extract tokens used and summary from the response
    console.log("GPT Response ", result);
    const mess = result.choices[0].message;
    let summary = null;
    if (mess.tool_calls && mess.tool_calls.length > 0) {
      let tool = mess.tool_calls[0];
      if (tool.function.name == "get_date_advice") {
        console.log("Call the date advice function");

        let advice = getDatingAdviceFromTristan();
        if (advice) {
          //call open ai to generate a message
        }
      }
    } else {
      summary = mess.content;
      //   const tokensUsed = result.usage.total_tokens;
      //   const cost = (tokensUsed / 1000) * pricePer1000Tokens;

      // Return the summary, token count, and cost in a JSON object
      return summary;
    }
  } catch (error) {
    console.error("Error summarizing text:", error);
    return null;
  }
}
