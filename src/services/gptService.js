// src/services/gptService.js
import axios from 'axios';
import OpenAI from "openai";
import { Pinecone }  from '@pinecone-database/pinecone';
import { split } from 'sentence-splitter';

// console.log("Key is ", process.env.AIKey)
const openai = new OpenAI({ apiKey: process.env.AIKey });

const pineconeClient = new Pinecone({
  apiKey: process.env.PineConeApiKey
});

const indexName = 'voice-context';

(async () => {
  

  const existingIndexes = await pineconeClient.listIndexes();
  const indexNames = existingIndexes.indexes.map(index => index.name);
  console.log("Existing", indexNames)
  if (indexNames.length > 0 && indexNames.includes(indexName)) {
    
  }
  else{
    await pineconeClient.createIndex({
      name: indexName,
      dimension: 1536, // OpenAI embedding dimension
      metric: 'euclidean', // Replace with your model metric
      spec: { 
          serverless: { 
              cloud: 'aws', 
              region: 'us-east-1' 
          }
      } 
    });
  }
})();

export const sendMessageToGPT = async (message, agent) => {
  // Implement the logic to send the message to GPT and get a response
  // This is a placeholder, replace with actual GPT API integration
  console.log("Using key ", process.env.AIKey)
//   console.log("Using chatid ", chatId)

  try {

    const contexts = await FindContext(message, agent) || "";
    let history = ""
    if(contexts.length > 0){
      history = contexts.join('\n');
    }
    // console.log("Context is ", history)
    // return 
    let messages = [{role: "system", content: history, type: "history", command: "Answer according to this context."}, { role: "user", content: message , command: "Answer according to the previous context. Be short and specific. Not too much details. Do not answer if the answer doesn't fall under the given context. Just say that you don't know the answer to that."}]
    
    console.log("Messages sent to gpt ", messages)
    const completion = await openai.chat.completions.create({
      messages: messages,//[...previousMessages, {role: "user", content: message}],
      model: "gpt-4o",
    });

    const newMessageId = Date.now(); // Or use a more robust unique ID generator
    
    // messages.push({role: "system", content: completion.choices[0]})
    // const newContext = JSON.stringify(JSON.stringify([{ role: "user", content: message }, {role: "system", content: completion.choices[0]}]));


    // let saved = await ConvertAndStoreEmbeddings(newContext, chatId)

    console.log(completion);
    return completion
  }
  catch (error) {
    console.log("Error sending to gpt", error)
  }
};




export const ConvertAndStoreEmbeddings = async (text, agent = 'Tai-Lopez') => {
  // Create Pinecone index
//   console.log("Storing context embeddings", chatId)
  try{
    
    const index = pineconeClient.Index(indexName);
    // const embedding = await getEmbedding(text);
    let chunks = chunkText(text, 100)
    console.log("size chunks", chunks.length)
    // return null
    let embeddings = await getChunkEmbeddings(chunks)
    await Promise.all(embeddings.map(async (embedding) => {
        await index.upsert(
            [
              {
                id: `${Date.now()}`,
                values: embedding.embedding,
                metadata: { text: embedding.text, agent: agent },
              },
            ],
        );
      }));
    
      
      return true
  }
  catch(error){
    console.log("Embeddings store error ", error)
    return null
  }
}

 const FindContext = async (query, agent = "Tai-Lopez") => {
  try {
    // const { chatId, query } = req.body;
    let topVectors = 50
    if(query == null){
      console.log("Find Context  query null", query)
      topVectors = 50
      query = "Tai Lopez"
    }
    const queryEmbedding = await getEmbedding(query);
    const index = pineconeClient.Index(indexName);
    const searchResults = await index.query({
      
        topK: topVectors,
        vector: queryEmbedding,
        includeMetadata: true,
        filter: {
          agent: agent,
        },
    });
    console.log("QUERY IS ", query)
console.log('Comtext Result', searchResults.count)
    const contextTexts = searchResults.matches.map((match) => match.metadata.text);
    return contextTexts
  } catch (error) {
    console.log("Error finding context ", error)
    return null
  }
}


async function getChunkEmbeddings(textChunks) {
    const embeddings = await Promise.all(textChunks.map(async (chunk) => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: chunk,
        encoding_format: "float",
      });
      return {embedding: response.data[0].embedding, text: chunk};
    }));
    return embeddings;
  }


const getEmbedding = async (text) => {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
    encoding_format: "float",
  });
  console.log("Embeddings response ", response)
  return response.data[0].embedding;
};


function chunkText(text, maxTokens = 100) {
  if (!text || typeof text !== 'string') {
    throw new Error("Invalid input text");
  }

  try {
    // Split the text into sentences
    const sentences = split(text).map(sentence => sentence.raw);

    let currentChunk = [];
    let currentTokenCount = 0;
    const chunks = [];

    sentences.forEach(sentence => {
      // Split sentence into words and count tokens
      const words = sentence.split(" ");
      const tokenCount = words.length;

      // Check if adding the sentence would exceed max tokens
      if (currentTokenCount + tokenCount > maxTokens) {
        // Push the current chunk and start a new one
        chunks.push(currentChunk.join(" ").trim());
        currentChunk = words;
        currentTokenCount = tokenCount;
      } else {
        // Add words to the current chunk
        currentChunk.push(...words);
        currentTokenCount += tokenCount;
      }
    });

    // Push the last chunk if not empty
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(" ").trim());
    }

    return chunks;
  } catch (error) {
    console.error("Error while chunking text:", error);
    throw new Error("Failed to chunk text");
  }
}

//   module.exports = { sendMessageToGPT, ConvertAndStoreEmbeddings, FindContext }
// export { sendMessageToGPT, ConvertAndStoreEmbeddings, FindContext }