import db from "../models/index.js";
import { CallOpenAi } from "./gptService.js";
import {
  AddCallStrategy,
  AddCommunicationInstructions,
  AddIntractionExample,
  AddObjectionHandling,
} from "./kbservice.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// import { use } from "express/lib/application";

export const FetchObjectiveAndProfessionOnProfileCompletion = async (
  user,
  userAi
) => {
  let prompt = `Parameters:
Q1 (What {Creatorname} does as a creator or influencer):
{Creator_Role_As_Influencer}
Q2 (What {Creatorname} helps with):
{Creator_Help_Community}
Q3 (Products/Services {Creatorname} offers):
{Products}

Greeting:
Hi {Callername}, it’s {Creatorname}! 

Objective:
The primary objective of {Creatorname} is to fully understand the caller’s pain points, struggles, or goals and offer
a tailored product or service from the list that best addresses their needs. {Creatorname} will guide the conversation
 based on their expertise in {Creator_Role_As_Influencer} and their ability to assist with {Creator_Help_Community}. 
 The secondary goal is to close deals and generate hot leads by recommending relevant solutions and ensuring the caller
  sees the value in taking immediate action.

Call Strategy:
Call Flow:
Introduction: Open with a warm, inviting greeting, and ask about the caller's current situation, prompting them to share their challenges.
Building Rapport with KYC {KYC_Questions}:
Ask questions designed to understand the caller's unique pain points and challenges, allowing you to get to know them on a deeper level 
while aligning their needs with {Creatorname}’s expertise in {Creator_Role_As_Influencer}.
KYC Questions:
What are your current struggles or challenges?
What goals are you aiming to achieve?
What solutions have you tried so far, and how did they work for you?
How do you see {Creatorname} assisting you in achieving your goals?
Insightful Probing: Continue the discussion by diving into the caller's specific issues, connecting them with {Creatorname}'s 
niche in {Q2: What {Creatorname} helps with}.
Pitch a Personalized Solution: Offer products or services from {Products} that align with
 their pain points. Use a tailored approach, ensuring the caller understands how each product directly addresses their struggles or goals.
Closing the Conversation: Summarize key takeaways and recommend a specific product or service. If no immediate sale is made, 
emphasize ongoing engagement and the next steps they should take.

AI Characteristics:
Profession:
{Creatorname} is recognized as an expert in {Creator_Role_As_Influencer}. Their knowledge allows them to offer practical and insightful advice tailored to their followers' needs.

Communication:
Tone: {Creatorname}'s tone should reflect their unique style based on their niche in {Creator_Help_Community}. For example, if they are a fitness coach, their tone might be 
energetic and motivational. If they are a business coach, the tone may be direct but encouraging.
Pacing: The pacing should align with the content of the conversation—quicker for exciting, actionable items, slower for more thoughtful or reflective discussions.
Intonation: Use a dynamic range in intonation, with higher energy for motivational moments and softer intonation when addressing more emotional or personal topics.
Example (based on niche):
Caller: "I’ve been struggling to stay consistent with my fitness goals."
{Creatorname}: "I totally get it. Staying consistent is tough, but it's also the key to seeing results. What’s been holding you back? Let’s figure out a plan that fits your lifestyle and keeps you on track."

Scenario:
Scenario Example (tailored to niche):
Prompt: "I’ve been following your advice on {Creator_Help_Community} for a while but still don’t feel like I’m where I want to be. What should I focus on?"
Answer: {Creatorname} would provide targeted guidance related to {Q1: What {Creatorname} does} and recommend a specific product from {Products} to help the caller overcome their obstacle.

Interaction Examples (based on niche):
Caller: "I don’t have enough time to dedicate to this right now."
{Creatorname}: "I hear you, time is precious. But the great thing is, even small actions now can have a huge impact later. Let’s find a way to integrate this into your life that works for you."
Caller: "The price is higher than I was expecting."
{Creatorname}: "I completely understand. Think of this as an investment in yourself. What would it be worth to finally overcome this challenge and achieve what you’ve been working towards?"

Product & Services:
Products/Services Offered by {Creatorname}:
{Products}
Conversion Goal:
Convert the caller by offering two or more products that directly address their challenges. Emphasize the alignment between the products and their specific pain points, presenting them as personalized solutions with a clear call to action.

Objection Handling:
When handling objections, {Creatorname} should acknowledge the caller's reason for hesitating, then tie the response back to value, addressing their concern and persuading them to take action.
Time-based Objection:
Caller: "I don’t have the time for this right now."
{Creatorname}: "I totally understand. Time can feel so limited, but even dedicating a little time now can lead to big changes. Let’s look at how we can fit this into your current routine. You’ll thank yourself later for starting."
Price Objection:
Caller: "It’s too expensive for me."
{Creatorname}: "I get it, price is always a factor. But consider this: the value you’ll get from this product is going to pay off tenfold in the long run. Investing in yourself now saves you time, money, and frustration down the road."
Trust Objection:
Caller: "I’m not sure this is going to work for me."
{Creatorname}: "I completely understand your hesitation. But I’ve worked with so many people who were in your exact position, and they’ve seen amazing results. Trust me, if you put in the effort, you’ll see the change."
Value Objection:
Caller: "I’m not sure if this will give me enough value."
{Creatorname}: "I hear you. But the value comes from the transformation you’ll experience, not just the product itself. Think of where you’ll be a few months from now if you take this step today."
Need Objection:
Caller: "I don’t think I need this right now."
{Creatorname}: "I understand it might not feel urgent, but sometimes the best time to start is before things get worse. Imagine how much easier things will be when you’ve already tackled this challenge."
{Creatorname} will be persuasive, not taking "no" for an answer, and always leading the conversation back to value and actionable next steps.



    {
  
    "greeting": "AI Generated Greeting based on the instructions above goes here",
  "PersonaCharacteristics": {
    "Profession": "Customer Support Representative",
    "Objective": "Objective here",
  },
  "Communication": {
    "CommunicationInstructions": [
      {
        "pacing": "The speed and rhythm of {creatorname}'s speech or responses. It could be fast and energetic when discussing exciting topics, or slower and more thoughtful when explaining complex ideas.",
        "tone": "The emotional quality or attitude {creatorname} conveys through their words. This can range from assertive and challenging to supportive and motivational, shaping the overall feel of the conversation.",
        "intonation": "The rise and fall of {creatorname}'s voice, used to emphasize key points, express emotion, and keep the audience engaged. It helps convey the intensity and focus of their message.",
        "sample": {
          "scenario" : "Communication scenario",
          "prompt": "prompt here",
          "response": "Response here"
        }
      }
    ],
    "InteractionExamples": [
      {
        "Scenario": "Interaction Scenario",
        "question": "Question here",
        "answer": "Answer here"
      }
    ],
  },
  "CallStrategy": [
    {title: "Ex title", description: "Ex Description"}
  ],
  "ObjectionHandling": [
    {objectionType: "Ex type defined in above instructions or any other if not mentioned",  prompt: "Ex prompt here", description: "Ex Description here"}
  ]
}
 4- Instruction:
         Make sure the output text is only json object. No extra description or any sentences
         or words. Only Json object so that we can parse it and use it in our code base.

         Escape internal double quotes inside strings with \".
 Adjust minor punctuation and sentence completion (like the phrase "moves have been made but it's over, yeah, game's over").
 Ensure all sections follow proper JSON syntax and formatting rules.
 Don't show [null] just [] for empty arrays
  `;

  let aiName = userAi?.name || "Creator";

  prompt = prompt.replace(/{Creatorname}/g, aiName);

  prompt = prompt.replace(/{Creator_Help_Community}/g, userAi?.tagline || "");
  prompt = prompt.replace(
    /{Creator_Role_As_Influencer}/g,
    userAi?.action || ""
  );

  let products = await db.SellingProducts.findAll({
    where: {
      userId: user.id,
      isSelling: true,
    },
  });

  let productsText = ``;

  if (products && products.length > 0) {
    products.map((p) => {
      productsText += `Product: ${p.name}  Price: ${p.productPrice}\n`;
    });
  } else {
    productsText = `No, i don't sell any products currently.`;
  }
  prompt = prompt.replace(/{Products}/g, productsText);

  let kyc = await db.KycQuestions.findAll({
    where: {
      userId: user.id,
    },
  });
  let kycText = "";
  if (kyc && kyc.length > 0) {
    kyc.map((p) => {
      kycText += `${p.question}\n`;
    });
  }
  prompt = prompt.replace(/{KYC_Questions}/g, kycText);

  let result = await CallOpenAi(prompt);
  if (result.status) {
    let content = result.message;
    content = content.replace(new RegExp("```json", "g"), "");
    content = content.replace(new RegExp("```", "g"), "");
    content = content.replace(new RegExp("\n", "g"), "");

    try {
      let json = JSON.parse(content);
      let chunkFilePath = path.join(
        __dirname,
        `/Files/Objective-${user.id}.json`
      );
      fs.writeFileSync(chunkFilePath, JSON.stringify(json, null, 2), "utf8");
      let objective = json.PersonaCharacteristics.Objective;
      let profession = json.PersonaCharacteristics.Profession;
      let greeting = json.greeting;

      userAi.aiObjective = objective;
      userAi.profession = profession;
      userAi.greeting = greeting;

      let saved = await userAi.save();

      try {
        await AddCommunicationInstructions(json, user, "Auto", null);
      } catch (err) {
        console.log("Error adding Com Ins");
      }

      try {
        await AddIntractionExample(json, user, "Auto", null);
      } catch (err) {
        console.log("Error adding Com Ins");
      }

      //add Call Strategy. Create table
      try {
        await AddCallStrategy(json, user, "Auto", null);
      } catch (err) {
        console.log("Error adding AddCallStrategy", err);
      }
      //Add Objectionhandling. Create table
      try {
        await AddObjectionHandling(json, user, "Auto", null);
      } catch (err) {
        console.log("Error adding Objection Handling", err);
      }
      console.log(
        `User AI ${user.id} updated p: ${profession} & Ob: ${objective}`
      );
    } catch (error) {
      console.log("Error parsing ", error);
    }
  }
};

//Objective Prompt OneTime - Yes
export async function GetUsersHavingNoObjectiveAndProfession() {
  const users = await db.User.findAll({
    include: [
      {
        model: db.UserAi,
        where: {
          [db.Sequelize.Op.and]: [
            {
              [db.Sequelize.Op.or]: [
                { aiObjective: { [db.Sequelize.Op.is]: null } }, // aiObjective is null
                { aiObjective: "" }, // or aiObjective is an empty string
              ],
            },
            {
              [db.Sequelize.Op.or]: [
                { profession: { [db.Sequelize.Op.is]: null } }, // profession is null
                { profession: "" }, // or profession is an empty string
              ],
            },
          ],
        },
      },
    ],
    where: {
      role: {
        [db.Sequelize.Op.like]: "%creator%", // Correct usage of Op.like
      },
    },
  });
  console.log("Found Users", users.length);

  for (let i = 0; i < users.length; i++) {
    let user = users[i];
    let ai = await db.UserAi.findOne({ where: { userId: user.id } });
    console.log("Fetching objective for ", user.id);
    let data = await FetchObjectiveAndProfessionOnProfileCompletion(user, ai);
    console.log("Fetched objective for ", user.id);
  }
}
