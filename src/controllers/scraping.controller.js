import db from "../models/index.js";
import JWT from "jsonwebtoken";
import qs from "qs";
import axios from "axios";
import { google } from "googleapis";
import twilio from "twilio";

const User = db.User;
const Op = db.Sequelize.Op;

import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import { addToVectorDb, findVectorData } from "../services/pindeconedb.js";

export const ScrapeTweets = async (req, res) => {
  let url = req.body.url;
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Set User-Agent to avoid being blocked
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2" });

    let tweets = [];
    let previousTweetCount = 0;
    const maxScrolls = 30; // Increase the number of scrolls
    let scrollCount = 0;

    while (tweets.length < 100 && scrollCount < maxScrolls) {
      // Extract tweets from the page
      const newTweets = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("article div[lang]")).map(
          (tweet) => tweet.innerText
        );
      });

      tweets = [...tweets, ...newTweets];
      tweets = [...new Set(tweets)]; // Remove duplicates
      //console.log("Twwets", tweets);
      // If no new tweets were loaded, break the loop
      if (tweets.length === previousTweetCount) {
        //console.log("No more tweets loaded, breaking out of the loop.");
        break;
      }

      previousTweetCount = tweets.length;

      // Scroll down
      await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");

      // Wait longer between scrolls to allow new content to load
      await new Promise((resolve) => setTimeout(resolve, 4000));

      scrollCount++;
    }

    await browser.close();
    // //console.log(tweets);
    return res.send({ status: true, message: "Tweets", data: tweets });
  } catch (error) {
    console.error("Error fetching the URL:", error);
    return res.send({
      status: false,
      message: "Error fetching the URL:",
      data: null,
    });
  }
};

export const ScrapWebUrl = async (
  user,
  url = "https://thetristansocial.webflow.io/"
) => {
  //Use GPT to scrape the data

  let scrapedData = await scrapUrl(url);
  console.log("Data scraped ", scrapedData);
  let prompt = `Website URL: ${url}

Part 1: Chunk and Extract Key Information
Website Data:
This WebsiteScrapedData was scraped from the website ${url}. The website focuses on ${scrapedData.title} and includes sections like {section names, e.g., About, Blog, Services, etc.}. We'll treat the various sections as "chunks" of content and pull relevant information from each one to extract the most valuable insights.

Step 1: Break down the website content into meaningful chunks based on its structure, like sections or topics.
For the About section: Provide background on the person/company, key values, and their mission.
For Blog/Articles: Extract key topics discussed, main points, any frameworks, lessons, or strategies the author uses, as well as personal anecdotes.
For Services/Products: Highlight offerings, key benefits, features, and any client testimonials or use cases.
For Contact/FAQ: Extract the most common questions and key information the user might ask or find important.
Format:
For each section, provide a bullet-point list of the main points, key topics, frameworks, lessons, key messages, and any questions that users might typically ask.
Example:
About Section:
The website belongs to {creator/business name}.
{Creator/Business} is focused on {industry/field} and emphasizes {values/mission}.
Highlight any personal story or background on the creator's journey.
Main message: "The company aims to provide {service} for {target audience}."
Blog Post 1: {title of the post} (word 1 - word 2000):
Main topics: Discusses {topic}, {framework}, and {strategy}.
Key frameworks: {framework or model name}.
Key lessons: Emphasizes {important lesson or takeaway}.
Key message: "The goal is to {action or takeaway from the article}."
Personal story shared: {any anecdotes or personal stories mentioned in the post}.
Common questions: What is {framework or strategy}? How can {action} help my business/life?
Services:
Key services offered: {service 1, service 2, etc.}.
Main benefits: {list benefits of the services}.
Client use case: {brief example of a customer testimonial or success story}.
FAQ Section:
Most common question: "What is {question}?"
Key answer: Provides guidance on {specific topic or issue}.

Part 2: Generate Prompt/Response Pairs
Now, based on the chunks we’ve defined from the website data, create prompt/response pairs covering all possible interactions around the main points, key topics, key frameworks, key lessons, key messages, and common questions users may ask.
Each response should be conversational, incorporating intonations, transitional words, and a natural, human-like tone that matches the website’s or creator’s style. Mimic the voice of the website's creator in your responses.
Example Prompts and Responses:
About Section:
Prompt: "Can you tell me more about the mission of {business name}?"
Response (in the voice of the website owner): "Absolutely! Our mission at {business name} is all about {value/mission}. You see, when I started this journey, I wanted to {reason for starting the business}. It's been such a fulfilling path to help others {goal or service}’."
Blog Post:
Prompt: "What are the key lessons from the post {title}?"
Response (in the voice of the blog author): "Great question! In this post, the main takeaway is to focus on {key lesson}. When you apply the {framework/strategy} I shared, you'll see improvements in {specific area}. Let me walk you through how {example or personal story} really highlights this point."
Service Section:
Prompt: "What services does {business name} offer, and how can they help me?"
Response (in the voice of the service provider): "We offer a variety of services including {list of services}. Each one is designed to {explain the benefit of each service}. For example, our {specific service} is perfect for businesses that need {specific outcome}. One of our clients used it and saw {testimonial or success story}."
FAQ Section:
Prompt: "What is the process for {service/product}’?"
Response (in the voice of the website owner): "Oh, that's a common question! The process is actually really simple. First, we {step 1}, then we {step 2}, and finally you’ll {end result}’. We’ve designed it this way to make it as smooth as possible for you!"

Final Considerations:
Before starting the prompts, it's important to understand:
Tone: The tone of the website should be reflected in the responses. If the site is conversational and friendly, the responses should mirror that. If the tone is professional or technical, keep that consistent.
Voice of the Creator: Use the language, style, and key phrases that the website owner or business emphasizes, whether it’s motivational, educational, or promotional.
Relevance: Focus on drawing out the most important and relevant information for users who are interacting with the site or seeking specific knowledge.

WebsiteScrapedData: ${scrapedData.content}
`;
  console.log("Scrapping ", url);
  let summary = await summarizeText(prompt);
  if (typeof summary.summary != "undefined") {
    console.log("Cost", summary.cost);
    console.log("Tokens", summary.tokensUsed);

    let ai = await db.UserAi.findOne({
      where: {
        userId: user.id,
      },
    });

    if (ai) {
      ai.webUrlScrapedData = summary.summary || "";
      let saved = await ai.save();
      console.log("Data Scrapped from url");
    }
  } else {
    console.log("Error Fetching Summary");
  }
};

const scrapUrl = async (url) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to the provided URL
    await page.goto(url, { waitUntil: "networkidle2" });

    // Increase timeout and wait for a different selector based on the page structure
    await page.waitForSelector("body", { timeout: 20000 });

    // Optionally, wait for a specific element if you know the structure, e.g., a div or section
    await page.waitForSelector("div", { timeout: 20000 });

    // Scrape data from the page (adjust the selector based on your inspection of the page)
    const data = await page.evaluate(() => {
      const pageTitle = document.querySelector("title").innerText; // Example of scraping the page title
      const mainContent = Array.from(document.querySelectorAll("div")).map(
        (div) => div.innerText
      );

      return {
        title: pageTitle,
        content: mainContent,
      };
    });

    console.log(`Scraped data `, data);

    // Return the scraped data
    return data;
  } catch (error) {
    console.error(`Error scraping URL ${url} for user `, error);
    return {
      url,
      error: error.message,
    };
  } finally {
    await browser.close();
  }
};

async function summarizeText(promptText) {
  // console.log("Transcript ", transcript);
  const model = "gpt-4-turbo"; // You specified gpt-4, or it can be "gpt-4-turbo"
  const apiUrl = "https://api.openai.com/v1/chat/completions";

  // Pricing details for GPT-4
  const pricePer1000Tokens = 0.03; // $0.03 per 1K tokens for GPT-4 (adjust this based on OpenAI's pricing)

  try {
    // Make the request to the OpenAI API
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
            content: promptText,
          },
        ],
        max_tokens: 3000, // Limit the number of tokens for the response (adjust as needed)
      }),
    });

    // Parse the response
    const result = await response.json();

    // Extract tokens used and summary from the response
    console.log("GPT Response ", result);
    const summary = result.choices[0].message.content;
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

export const AddKnowledgeBase = async (req, res) => {
  let text = req.body.text;
  let type = req.body.type || "text";
  let userId = req.body.userId;

  let user = await db.User.findByPk(userId);
  if (!user) {
    return res.send({ message: "No such user", status: false });
  }

  let added = await addToVectorDb(text, user, type);
  if (added) {
    return res.send({ message: "Added", status: true, data: added });
  }
  return res.send({ message: "Not added", status: false });
};

const getDatingAdviceFromTristan = async (text, user) => {
  // we decide which index to go to

  let context = await findVectorData(text, user, "kb-index-processed"); // string context
  let rawContext = await findVectorData(text, user, "kb-index-transcript");

  return context + rawContext;
};

export async function ChatTristan(req, res) {
  let message = req.body.message;
  let chatId = req.body.chatId;

  let assistant = await db.User.findByPk(7);
  // console.log("Transcript ", transcript);
  const model = "gpt-4o"; // You specified gpt-4, or it can be "gpt-4-turbo"
  const apiUrl = "https://api.openai.com/v1/chat/completions";

  // Pricing details for GPT-4

  let BasePrompt = `Get the business advice for customer from alex. Call this whenever you need to know the business or sales advice, 
        for example when a user asks 'How can I improve my sales tactics to be more effective?' OR 'Can you give advice
         on closing a sale effectively?' OR 'How do you balance emotional appeal with logical arguments in your sales 
         process?' OR 'Strategies to improve business' OR 'Sales approach to different types of customers' OR
           OR 'deal with a potential customer who seems interested but hesitan' OR 'sales pitches less about the sale 
           and more about the relationship?' 'Grow business' OR 'Grow Sales', 'Engage Customers' OR 'Hiring the right team' OR similar broad 
           spectrum of things related to business etc`;

  BasePrompt = `If users ask about business, 13 Years of No BS Business Advice in 79 Mins, How to Sell Better than 99% Of People, 
  life events, personal stories, then access or use this knowledge base.`;
  const tools = [
    {
      type: "function",
      function: {
        name: "get_business_advice",
        description: BasePrompt,
        parameters: {
          type: "object",
          properties: {
            user_question: {
              type: "string",
              description: "The customer's question about business or sales.",
            },
          },
          required: ["user_question"],
          additionalProperties: false,
        },
      },
    },
  ];
  //   let dbMessages = await db.ChatModel.findAll({
  //     where: {

  //     }
  //   })

  const messages = [
    {
      role: "system",
      content: `You're a helpful business coach and motivational speaker. 
        So help the user regarding their business related queries. 
        Motivate them if they're feeling down.  Make sure you follow
         the tone of the speaker from the context given.`,
    },
    {
      role: "user",
      content: message,
    },
  ];

  const pricePer1000Tokens = 0.03; // $0.03 per 1K tokens for GPT-4 (adjust this based on OpenAI's pricing)

  try {
    // Make the request to the OpenAI API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AIKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        tools: tools,
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
      if (tool.function.name == "get_business_advice") {
        console.log("Call the date advice function");
        let argumentString = tool.function.arguments;
        let jsonArgs = JSON.parse(argumentString);
        let user_question = jsonArgs.user_question;

        let advice = await getDatingAdviceFromTristan(user_question, assistant);
        if (advice) {
          console.log("Found advice", advice);
          //   call open ai to generate a message
          let responseAI = await callOpenAi(user_question, advice);
          return res.send(responseAI);
        } else {
          console.log("Not able to find advice");
        }
      }
    } else {
      summary = mess.content;
      const tokensUsed = result.usage.total_tokens;
      const cost = (tokensUsed / 1000) * pricePer1000Tokens;

      // Return the summary, token count, and cost in a JSON object
      return res.send({
        message: summary,
        tokensUsed: tokensUsed,
        cost: cost.toFixed(4), // Formatting cost to 4 decimal places
      });
    }
  } catch (error) {
    console.error("Error summarizing text:", error);
    return res.send({
      error: error.message,
    });
  }
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
        content: `You're a helpful business coach and motivational speaker. So help the user regarding 
          their business related queries. Motivate them if they're feeling down. Make sure you 
          follow the tone of the speaker from the context given. Keep the answer short and to the point. 
          Complete the answer in max 250 tokens or as less as you can. Also mention the tone of the speaker 
          from the given context and tell if this was ai response or derived from context. Make it look more like
          the context provided. Use as less rephrasing as you can. Provide a json format response like 
          {response: "here goes detailed response", tone: "Tone of speaker", rephrased: "Percentage of rephrasal "}`,
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
      return {
        message: summary,
        // tokensUsed: tokensUsed,
        // cost: cost.toFixed(4), // Formatting cost to 4 decimal places
      };
    }
  } catch (error) {
    console.error("Error summarizing text:", error);
    return {
      error: error.message,
    };
  }
}

export async function StartCallTwilio(req, res) {
  let toPhoneNumber = req.body.phone;
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  try {
    // Make an outbound call using Twilio
    const call = await client.calls.create({
      url: "https://www.blindcircle.com:444/incoming-call", // URL for TwiML to handle the call logic
      to: toPhoneNumber, // Destination number
      from: "+12136064500", // Twilio number you're calling from (213) 606-4500
      statusCallback: "https://www.blindcircle.com:444/call-status", // Set this to track call events
    });

    console.log(`Call initiated successfully! Call SID: ${call.sid}`);
    return call.sid; // Return the Call SID for tracking
  } catch (error) {
    console.error("Error initiating the call:", error);
    throw error;
  }
}
