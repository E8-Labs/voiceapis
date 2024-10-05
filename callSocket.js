import Fastify from "fastify";
import WebSocket from "ws";
import fs from "fs";
import dotenv from "dotenv";
import fastifyFormBody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import axios from "axios"; // Add axios to handle Whisper API requests
import { writeFile } from "fs/promises";
import { exec } from "child_process"; // For converting audio format using sox or ffmpeg

// Constants
export const SYSTEM_MESSAGE =
  "You are a helpful and knowledgeable AI assistant who loves to chat about business, sales, and maintaining a business. You also answer based on the user's previous conversation history and additional context.";
export const VOICE = "alloy";
export const PORT = 5050;
export const LOG_EVENT_TYPES = [
  "response.content.done",
  "rate_limits.updated",
  "response.done",
  "input_audio_buffer.committed",
  "input_audio_buffer.speech_stopped",
  "input_audio_buffer.speech_started",
  "session.created",
];

// Load environment variables
dotenv.config();
const AIKey = process.env.OPENAI_API_KEY;
if (!AIKey) {
  console.error("Missing OpenAI API key. Please set it in the .env file.");
  process.exit(1);
}

// Function to transcribe audio using Whisper API
async function transcribeAudio(filePath) {
  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("model", "whisper-1");

    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${AIKey}`,
          ...formData.getHeaders(),
        },
      }
    );
    return response.data.text; // This will return the transcription text
  } catch (error) {
    console.error(
      "Error transcribing audio:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
}

// Simulate fetching knowledge base based on query
async function getKnowledgeBase(query) {
  if (query.includes("business")) {
    return "Business growth strategies include expanding into new markets and improving customer retention.";
  } else if (query.includes("sales")) {
    return "For improving sales, focus on understanding customer needs and optimizing your sales process.";
  }
  return "No specific knowledge base found for this query.";
}

// Save base64 audio data as a file
async function saveAudioFile(base64Data, filePath) {
  const buffer = Buffer.from(base64Data, "base64");
  await writeFile(filePath, buffer);
  console.log(`Audio saved to ${filePath}`);
}

// Convert G711 ulaw audio to mp3 or wav using ffmpeg or sox
async function convertAudio(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    // You can use sox or ffmpeg installed on the system to convert the file
    const command = `ffmpeg -y -f ulaw -ar 8000 -i ${inputFilePath} ${outputFilePath}`; // Example using ffmpeg
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error converting audio: ${error.message}`);
        return reject(error);
      }
      console.log(`Audio converted to ${outputFilePath}`);
      resolve(outputFilePath);
    });
  });
}

// Initialize Fastify
const fastify = Fastify();
fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

fastify.all("/incoming-call", async (request, reply) => {
  const callSid = request.query.CallSid || ""; // Get the CallSid from the incoming call
  console.log(`Call started with Call SID: ${callSid}`);

  console.log(`Call started at hose: ${request.headers.host}`);

  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
                          <Response>
                              <Say>Please wait</Say>
                              <Pause length="1"/>
                              <Say>OK, Speak!</Say>
                              <Connect>
                                  <Stream url="wss://${request.headers.host}:5050/media-stream?callSid=${callSid}" />
                              </Connect>
                          </Response>`;
  reply.type("text/xml").send(twimlResponse);
});
// WebSocket route for media-stream
fastify.register(async (fastify) => {
  fastify.get("/media-stream", { websocket: true }, (connection, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const callSid = url.searchParams.get("callSid"); // Retrieve CallSid from query
    console.log(`Handling media stream for Call SID: ${callSid}`);

    const openAiWs = new WebSocket(
      "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
      {
        headers: {
          Authorization: `Bearer ${AIKey}`,
          "OpenAI-Beta": "realtime=v1",
        },
      }
    );

    openAiWs.on("open", () => {
      console.log("Connected to OpenAI Realtime API");
    });

    // Handle incoming messages from Twilio (user audio)
    connection.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        switch (data.event) {
          case "media":
            console.log("Receiving user audio stream");
            const userAudioBase64 = data.media.payload; // Audio in base64

            // Save the audio to a file
            const rawAudioFile = `./audio_${callSid}.ulaw`; // Save as ulaw
            const finalAudioFile = `./audio_${callSid}.mp3`; // Converted to mp3

            await saveAudioFile(userAudioBase64, rawAudioFile);

            // Convert to mp3 or wav using ffmpeg or sox
            await convertAudio(rawAudioFile, finalAudioFile);

            // Transcribe the converted audio using Whisper API
            const transcription = await transcribeAudio(finalAudioFile);
            console.log("User transcription:", transcription);

            // If transcription contains business/sales, fetch knowledge base
            let context = "";
            if (
              transcription &&
              (transcription.includes("business") ||
                transcription.includes("sales"))
            ) {
              context = await getKnowledgeBase(transcription);
            }

            // Send session update with context
            const sessionUpdateWithContext = {
              type: "session.update",
              session: {
                knowledge_base: [context],
                modalities: ["text", "audio"],
                voice: VOICE,
              },
            };
            console.log(
              "Sending session update with context:",
              JSON.stringify(sessionUpdateWithContext)
            );
            openAiWs.send(JSON.stringify(sessionUpdateWithContext));
            break;

          case "start":
            console.log("Incoming stream has started");
            break;

          default:
            console.log("Received non-media event:", data.event);
            break;
        }
      } catch (error) {
        console.error("Error parsing message:", error, "Message:", message);
      }
    });

    // Handle WebSocket connection close
    connection.on("close", () => {
      if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
      console.log("Client disconnected.");
    });

    openAiWs.on("close", () => {
      console.log("Disconnected from OpenAI Realtime API");
    });

    openAiWs.on("error", (error) => {
      console.error("Error in OpenAI WebSocket:", error);
    });
  });
});

fastify.post("/call-status", async (request, reply) => {
  const callSid = request.body.CallSid;
  const callStatus = request.body.CallStatus;

  console.log(`Call SID: ${callSid} is now ${callStatus}`);

  // Store or update the status in your database or application
  reply.sendStatus(200);
});

// Start the server
fastify.listen({ port: PORT }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server is listening on port ${PORT}`);
});
