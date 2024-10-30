import db from "../models/index.js";
import { CallOpenAi } from "./gptService.js";

let Creatorname = "{Creatorname}",
  Creator_Role_As_Influencer = "{Creator_Role_As_Influencer}",
  Creator_Help_Community = "{Creator_Help_Community}",
  Products = "{Products}",
  Callername = "{Callername}",
  KYC_Questions = "{KYC_Questions}";

let MasterPromptV1_0 = `
`;

async function getCallStrategy(user) {
  let callStrategyText = "Call Strategy:\n";
  let callStrategy = await db.CallStrategy.findAll({
    where: {
      userId: user.id,
    },
  });
  if (callStrategy && callStrategy.length > 0) {
    let index = 0;
    callStrategy.map((item) => {
      callStrategyText += `${index}: ${item.title}: ${item.description}\n`;
      index = index + 1;
    });
  }
  return callStrategyText;
}

async function GetPersonalityTraits(user, userAi) {
  let traitsText = "";

  let traits = await db.PersonalityTrait.findAll({
    where: {
      userId: user.id,
    },
  });
  if (traits && traits.length > 0) {
    traits.map((item) => {
      traitsText += `${item.title}: ${item.description}\n`;
    });
  }

  return `Traits:\n${traitsText}\n`;
}

async function GetValuesAndBeliefs(user, userAi) {
  let valuesText = "",
    beliefsText = "";
  let userValues = await db.UserValues.findAll({
    where: {
      userId: user.id,
    },
  });
  if (userValues && userValues.length > 0) {
    userValues.map((item) => {
      valuesText += `${item.title}: ${item.description}\n`;
    });
  }

  let userBeleifs = await db.UserBeliefs.findAll({
    where: {
      userId: user.id,
    },
  });
  if (userBeleifs && userBeleifs.length > 0) {
    userBeleifs.map((item) => {
      beliefsText += `${item.title}: ${item.description}\n`;
    });
  }

  return `User Values:\n${valuesText}\nUser Beliefs:\n${beliefsText}\n`;
}

async function GetPhilosophyAndViews(user, userAi) {
  let philosophyText = "";
  let userValues = await db.UserPhilosophyAndViews.findAll({
    where: {
      userId: user.id,
    },
  });
  if (userValues && userValues.length > 0) {
    userValues.map((item) => {
      philosophyText += `${item.title}: ${item.description}\n`;
    });
  }

  // let userBeleifs = await db.UserBeliefs.findAll({
  //   where: {
  //     userId: user.id,
  //   },
  // });
  // if (userBeleifs && userBeleifs.length > 0) {
  //   userBeleifs.map((item) => {
  //     viewsText += `${item.title}: ${item.description}\n`;
  //   });
  // }

  return `Philosophies & Views:\n${philosophyText}\n`;
}

async function getAiCharacteristics(user, userAi) {
  let p = "AI Characteristics\n";
  if (userAi.profession) {
    p += `Profession: ${userAi.profession}\n`;
  }

  //Personal Background

  //User Values & Beliefs
  let valuesAndBeliefsText = await GetValuesAndBeliefs(user, userAi);
  p += `${valuesAndBeliefsText}`;

  //Personality Traits
  let traitsText = await GetPersonalityTraits(user, userAi);
  p += `${traitsText}`;

  //Philosophies & Views
  let philText = await GetPhilosophyAndViews(user, userAi);
  p += `${philText}`;

  return p;
}

async function GetInstructions(user, userAi) {
  let instructions = await db.CommunicationInstructions.findAll({
    where: {
      userId: user.id,
    },
  });

  let text = "Communication Instructions w/ sample communication :\n";

  if (instructions && instructions.length > 0) {
    instructions.map((item) => {
      text += `Pacing: ${item.pacing}\nTone: ${item.tone}\nIntonation: ${item.intonation}\nSampleCommunication:\n\tScenario:${item.scenario}\n`;
      text += `\t\tPrompt: ${item.prompt}`;
      text += `\t\Response: ${item.response}\n`;
    });
  }
  return text;
}

async function GetDemeanor(user, userAi) {
  let instructions = await db.UserDemeanor.findAll({
    where: {
      userId: user.id,
    },
  });

  let text = "Demeanor :\n";

  if (instructions && instructions.length > 0) {
    instructions.map((item) => {
      text += `\ttitle: ${item.tile}\Description: ${item.description}\n`;
    });
  }
  return text;
}

async function GetInterpersonalSkills(user, userAi) {
  let instructions = await db.InterpersonalSkills.findAll({
    where: {
      userId: user.id,
    },
  });

  let text = "Interpersonal Skills :\n";

  if (instructions && instructions.length > 0) {
    instructions.map((item) => {
      text += `\ttitle: ${item.tile}\Description: ${item.description}\n`;
    });
  }
  return text;
}

async function GetDonotQuestions(user, userAi) {
  let instructions = await db.DonotDiscuss.findAll({
    where: {
      userId: user.id,
    },
  });

  let text = "Do Not Discuss :\n";

  if (instructions && instructions.length > 0) {
    instructions.map((item) => {
      text += `\t${item.description}\n`;
    });
  }
  return text;
}

async function GetIntractionExamples(user, userAi) {
  let instructions = await db.IntractionExample.findAll({
    where: {
      userId: user.id,
    },
  });

  let text = "Interaction Examples :\n";

  if (instructions && instructions.length > 0) {
    instructions.map((item) => {
      text += `\tQuestion: ${item.question}\nAnswer: ${item.answer}\n`;
    });
  }
  return text;
}

async function GetPhrasesAndQuotes(user, userAi) {
  let instructions = await db.PhrasesAndQuotes.findAll({
    where: {
      userId: user.id,
    },
  });

  let text = "Phrases & Quotes :\n";

  if (instructions && instructions.length > 0) {
    instructions.map((item) => {
      text += `\t${item.description}\n`;
    });
  }
  return text;
}

//Common Questions = Communication FAQs
async function GetCommonQuestions(user, userAi) {
  let instructions = await db.CommunicationCommonFaqs.findAll({
    where: {
      userId: user.id,
    },
  });

  let text = "FAQ :\n";

  if (instructions && instructions.length > 0) {
    instructions.map((item) => {
      text += `\tQuestion: ${item.question}\nAnswer: ${item.answer}\n`;
    });
  }
  return text;
}

async function getCommunicationText(user, userAi) {
  let p = "Communication:\n";

  //User Values & Beliefs
  let instructions = await GetInstructions(user, userAi);
  p += `${instructions}`;

  //Demeanor
  let demeanor = await GetDemeanor(user, userAi);
  p += `${demeanor}`;

  //Interpersonal Skills
  let skills = await GetInterpersonalSkills(user, userAi);
  p += `${skills}`;
  //Communication Style

  //How do you explain complex concepts

  //Do Not Discuss
  let donots = await GetDonotQuestions(user, userAi);
  p += `${donots}`;

  //Intraction Examples
  let intr = await GetIntractionExamples(user, userAi);
  p += `${intr}`;

  //Phrases & Quotes
  let phrases = await GetPhrasesAndQuotes(user, userAi);
  p += `${phrases}`;

  //FAQs
  let faqs = await GetCommonQuestions(user, userAi);
  p += `${faqs}`;

  return p;
}

async function GetStrategiesAndTech(user, userAi) {
  // let p = "Specific Strategies and Techniques\n";
  let instructions = await db.FrameworkAndTechnique.findAll({
    where: {
      userId: user.id,
    },
  });

  let text = "Specific Strategies and Techniques:\n";

  if (instructions && instructions.length > 0) {
    instructions.map((item) => {
      text += `\title: ${item.title}\Description: ${item.description}\n`;
    });
  }
  return text;
}

async function GetObjectionHandling(user, userAi) {
  // let p = "Specific Strategies and Techniques\n";
  let instructions = await db.ObjectionHandling.findAll({
    where: {
      userId: user.id,
    },
  });

  let text = "Objection Handling:\n";

  if (instructions && instructions.length > 0) {
    instructions.map((item) => {
      text += `\t${item.objectionType}:\n\t\t Prompt: ${item.prompt}\nResponse: ${item.response}\n`;
    });
  }
  return text;
}

async function GetProductsServices(user, userAi) {
  // let p = "Specific Strategies and Techniques\n";
  let instructions = await db.SellingProducts.findAll({
    where: {
      userId: user.id,
      isSelling: true,
    },
  });

  let text = "Products & Services:\n";

  if (instructions && instructions.length > 0) {
    instructions.map((item) => {
      text += `\tName: ${item.name}  -  Price: ${item.productPrice}\n`;
    });
  }

  let faqs = await db.ProductFaqs.findAll({
    where: {
      userId: user.id,
    },
  });

  text += "\nProduct FAQs\n";
  if (faqs && faqs.length > 0) {
    faqs.map((item) => {
      text += `\tQuestion: ${item.question}\nAnswer: ${item.answer}\n`;
    });
  }
  return text;
}

async function GetKyc(user, userAi) {
  let kyc = await db.KycQuestions.findAll({
    where: {
      userId: user.id,
    },
  });
  let kycText = "KYC Questions:\n";
  if (kyc && kyc.length > 0) {
    kyc.map((p) => {
      kycText += `${p.question}\n`;
    });
  }

  return kycText;
}

export const GetMasterPrompt = async (user) => {
  let prompt = MasterPromptV1_0;
  let assistant = await db.Assistant.findOne({ where: { userId: user.id } });
  let userAI = await db.UserAi.findOne({ where: { userId: user.id } });
  let aiName = userAI?.name || "Creator";

  if (!userAI) {
    console.log("User doesn't have ai added");
    return;
  }

  //1- Objective
  prompt += `Objective:\n${userAI.aiObjective}\n`;

  //Call Strategy
  let callStrategyText = await getCallStrategy(user);
  prompt += `${callStrategyText}\n`;

  let kyc = await GetKyc(user, userAI);
  prompt += `${kyc}\n`;

  //Ai Characteristics
  let aiCharText = await getAiCharacteristics(user, userAI);
  prompt += `${aiCharText}\n`;

  //Communication Text
  let comText = await getCommunicationText(user, userAI);
  prompt += `${comText}\n`;

  //Strategies Text
  let strategies = await GetStrategiesAndTech(user, userAI);
  prompt += `${strategies}\n`;

  //Product & Services
  let productsText = await GetProductsServices(user, userAI);
  prompt += `${productsText}\n`;
  //Objection Handling Text
  let objHandling = await GetObjectionHandling(user, userAI);
  prompt += `${objHandling}\n`;

  console.log("Master Prompt Finalized", prompt);
  return prompt;
};

export async function CheckIfGeneratePromptFirstTime() {
  const users = await db.User.findAll({
    include: [
      {
        model: db.Assistant,
        where: {
          [db.Sequelize.Op.and]: [
            {
              [db.Sequelize.Op.or]: [
                { prompt: { [db.Sequelize.Op.is]: null } }, // aiObjective is null
                { prompt: "" }, // or aiObjective is an empty string
              ],
            },
          ],
        },
      },
    ],
    where: {
      role: {
        [db.Sequelize.Op.like]: "%creator%", // Correct usage of Op.like, but applied to Users table
      },
    },
  });

  console.log("Found Users With No Prompts", users.length);

  for (let i = 0; i < users.length; i++) {
    let user = users[i];
    let assistant = await db.Assistant.findOne({ where: { userId: user.id } });
    console.log("Fetching Prompt for ", user.id);
    let prompt = await GetMasterPrompt(user);
    // let gptSummarizedPrompt = await CallOpenAi(prompt);
    // //add step to generate base prompt from gpt
    // let basePrompt = gptSummarizedPrompt?.message || prompt;
    // console.log("Gpt Response ", basePrompt);

    assistant.prompt = prompt;
    let saved = await assistant.save();
    console.log("Fetched Prompt for ", user.id);
  }
}
