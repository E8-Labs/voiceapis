// import verifyJwtToken from "../middleware/jwtmiddleware"
import JWT from "jsonwebtoken";
import db from "../models/index.js";
import mammoth from "mammoth";
import { CallOpenAi } from "../services/gptService.js";
import { FetchObjectiveAndProfessionOnProfileCompletion } from "../services/OneTimeCronServices.js";

// import pdfParse from 'pdf-parse';

import pdfExtract from "pdf-extraction";
import fs from "fs";
import path from "path";
import {
  generateThumbnail,
  ensureDirExists,
} from "../utils/generateThumbnail.js";
import { create } from "domain";
import { createProductAndPaymentLink } from "../services/stripe.js";

export const GetAiForUser = async (userId) => {
  let ai = await db.UserAi.findOne({
    where: {
      userId: userId,
    },
  });
  let kb = await db.KnowledgeBase.findAll({
    where: {
      userId: userId,
    },
  });

  let products = await db.SellingProducts.findAll({
    where: {
      userId: userId,
    },
  });

  let questions = await db.KycQuestions.findAll({
    where: {
      userId: userId,
    },
  });

  let personalityTraits = await db.PersonalityTrait.findAll({
    where: {
      userId: userId,
    },
  });
  let Values = await db.UserValues.findAll({
    where: {
      userId: userId,
    },
  });
  let beliefs = await db.UserBeliefs.findAll({
    where: {
      userId: userId,
    },
  });
  let intractions = await db.IntractionExample.findAll({
    where: {
      userId: userId,
    },
  });
  let Frameworks = await db.FrameworkAndTechnique.findAll({
    where: {
      userId: userId,
    },
  });
  let Philosophies = await db.UserPhilosophyAndViews.findAll({
    where: {
      userId: userId,
    },
  });
  let DoNots = await db.DonotDiscuss.findAll({
    where: {
      userId: userId,
    },
  });
  let PhrasesAndQuotes = await db.PhrasesAndQuotes.findAll({
    where: {
      userId: userId,
    },
  });
  let CommunicationInstructions = await db.CommunicationInstructions.findAll({
    where: {
      userId: userId,
    },
  });

  let CallStrategy = await db.CallStrategy.findAll({
    where: {
      userId: userId,
    },
  });

  let ObjectionHandling = await db.ObjectionHandling.findAll({
    where: {
      userId: userId,
    },
  });

  let ProductFaqs = await db.ProductFaqs.findAll({
    where: {
      userId: userId,
    },
  });

  let InterpersonalSkills = await db.InterpersonalSkills.findAll({
    where: {
      userId: userId,
    },
  });

  let Demeanor = await db.UserDemeanor.findAll({
    where: {
      userId: userId,
    },
  });

  let CommunicatinCommonFaqs = await db.CommunicationCommonFaqs.findAll({
    where: {
      userId: userId,
    },
  });
  let Communicatinstyle = await db.CommunicationStyle.findAll({
    where: {
      userId: userId,
    },
  });
  return {
    ai: ai,
    Philosophies: Philosophies,
    DoNots: DoNots,
    PhrasesAndQuotes: PhrasesAndQuotes,
    CommunicationInstructions: CommunicationInstructions,
    kb: kb,
    products: products,
    questions: questions,
    traits: personalityTraits,
    beliefs: beliefs,
    values: Values,
    frameworks: Frameworks,
    intractions: intractions,
    callStrategy: CallStrategy,
    objectionHandling: ObjectionHandling,
    productFaqs: ProductFaqs,
    interpersonalSkills: InterpersonalSkills,
    demeanor: Demeanor,
    communicatinCommonFaqs: CommunicatinCommonFaqs,
    Communicatinstyle: Communicatinstyle,
  };
};
export const MyAi = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      let ai = await GetAiForUser(userId);
      res.send({
        status: true,
        data: ai,
        message: "My AI",
      });
    } else {
      res.send({ status: false, data: null, message: "Unauthenticated user" });
    }
  });
};

export const CreateProfessionAndObjectAfterProfileCompletion = async (
  req,
  res
) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      let user = await db.User.findByPk(userId);
      let ai = await db.UserAi.findOne({
        where: {
          userId: user.id,
        },
      });
      if (
        ai &&
        (ai.aiObjective == "" || ai.aiObjective == null) &&
        (ai.profession == "" || ai.profession == null)
      ) {
        await FetchObjectiveAndProfessionOnProfileCompletion(user, ai);
        return res.send({
          status: true,
          message: "Completed Objective & Profession retrieval",
        });
      } else {
        return res.send({
          status: false,
          message: "Can not run Objective & Profession retrieval now",
        });
      }
    } else {
      return res.send({
        status: false,
        message: "Unauthenticated user",
      });
    }
  });
};

export const BuildYourAi = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      let user = await db.User.findByPk(userId);
      let {
        name, // this should be the ai name
        action,
        tagline,
        fb_url,
        insta_url,
        youtube_url,
        discord_url,
        twitter_url,
      } = req.body;

      //console.log("URLS in request", {fb_url, insta_url, youtube_url, discord_url, twitter_url})
      let audio = null;
      if (req.files.media) {
        let file = req.files.media[0];

        const mediaBuffer = file.buffer;
        const mediaType = file.mimetype;
        const mediaExt = path.extname(file.originalname);
        const mediaFilename = `${Date.now()}${mediaExt}`;
        //console.log("There is a file uploaded");
        if (mediaType.includes("audio")) {
          // Ensure directories exist
          let dir = process.env.DocsDir; ///var/www/neo/neoapis/uploads
          const audioDir = path.join(dir + "/audios"); //path.join(__dirname, '../../uploads/images');
          //   const thumbnailDir = path.join(dir + "/thumbnails"); //path.join(__dirname, '../../uploads/thumbnails');
          ensureDirExists(audioDir);
          //   ensureDirExists(thumbnailDir);

          // Save audio
          const audioPath = path.join(audioDir, mediaFilename);
          fs.writeFileSync(audioPath, mediaBuffer);
          // image = `/uploads/images/${mediaFilename}`;
          audio = `https://www.blindcircle.com:444/voiceapp/uploads/audios/${mediaFilename}`;
          // Generate and save thumbnail
        }
      }

      //ai name should not update the username|unique url
      // user.username = name;
      // let userSaved = await user.save();
      let createdAI = await db.UserAi.create({
        name: name,
        action: action,
        tagline: tagline,
        audio: audio,
        userId: userId,
        fbUrl: fb_url,
        instaUrl: insta_url,
        youtubeUrl: youtube_url,
        discordUrl: discord_url,
        twitterUrl: twitter_url,
      });

      res.send({ status: true, message: "Ai created", data: createdAI });
    } else {
      res.send({ status: false, message: "Unauthenticated User" });
    }
  });
};

export const BuildAiScript = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      let products = req.body.products;
      let {
        greeting,
        possibleUserQuery,
        price,
        isFree,
        goalType,
        productsToSell, // an array. Not needed
        webinarUrl,
        goalTitle,
        goalUrl,
      } = req.body;
      let questions = req.body.kycQuestions;
      // let price = req.body.productPrice

      let createdAI = await db.UserAi.findOne({
        where: {
          userId: userId,
        },
      });
      if (createdAI) {
        createdAI.greeting = greeting;
        createdAI.possibleUserQuery = possibleUserQuery;
        createdAI.price = price;
        createdAI.isFree = isFree;
        createdAI.goalUrl = goalUrl;
        createdAI.goalTitle = goalTitle;
        createdAI.webinarUrl = webinarUrl;
        createdAI.goalType = goalType;

        //console.log("URLS in request", {fb_url, insta_url, youtube_url, discord_url, twitter_url})
        let audio = null;
        if (req.files && req.files.media) {
          let file = req.files.media[0];

          const mediaBuffer = file.buffer;
          const mediaType = file.mimetype;
          const mediaExt = path.extname(file.originalname);
          const mediaFilename = `${Date.now()}${mediaExt}`;
          //console.log("There is a file uploaded");
          if (mediaType.includes("audio")) {
            // Ensure directories exist
            let dir = process.env.DocsDir; ///var/www/neo/neoapis/uploads
            const audioDir = path.join(dir + "/audios"); //path.join(__dirname, '../../uploads/images');
            //   const thumbnailDir = path.join(dir + "/thumbnails"); //path.join(__dirname, '../../uploads/thumbnails');
            ensureDirExists(audioDir);
            //   ensureDirExists(thumbnailDir);

            // Save audio
            const audioPath = path.join(audioDir, mediaFilename);
            fs.writeFileSync(audioPath, mediaBuffer);
            // image = `/uploads/images/${mediaFilename}`;
            audio = `https://www.blindcircle.com:444/voiceapp/uploads/audios/${mediaFilename}`;
            // Generate and save thumbnail
            createdAI.audio = audio;
          }
        }

        let saved = await createdAI.save();
        if (createdAI && questions && questions.length > 0) {
          for (let i = 0; i < questions.length; i++) {
            let p = questions[i];
            let questionCreated = await db.KycQuestions.create({
              question: p.question,
              userId: userId,
            });
            if (questionCreated) {
              //console.log(`Question ${p.question} created`);
            }
          }
        }

        let dbProducts = [];
        if (products && products.length > 0) {
          for (let i = 0; i < products.length; i++) {
            let p = products[i];
            let stripeProduct = await createProductAndPaymentLink(
              userId,
              p.name,
              `Buy ${p.name} at $${p.productPrice}`,
              Number(p.productPrice),
              "image"
            );
            let productCreated = await db.SellingProducts.create({
              name: p.name,
              productPrice: p.productPrice,
              userId: userId,
              stripeProductId: stripeProduct.productId,
              stripePriceId: stripeProduct.priceId,
              stripePaymentLink: stripeProduct.paymentLink,
              isSelling: p.isSelling,
            });
            dbProducts.push(productCreated);

            // if (p.name == productToSell) {
            //   createdAI.productToSell = productCreated.id;
            //   await createdAI.save();
            // }
          }
        }

        // for(let i = 0; i < dbProducts.length; i++){
        //   let p = dbProducts[i]
        //   if(p.name == )
        // }

        res.send({ status: true, message: "Ai updated", data: createdAI });
      } else {
        res.send({
          status: false,
          message: "Build AI Step incomplete",
          data: null,
        });
      }
    } else {
      res.send({ status: false, message: "Unauthenticated User" });
    }
  });
};

export const UpdateYourAi = async (req, res) => {
  console.log("updating AI");
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      let user = await db.User.findByPk(userId);
      let {
        name,
        action,
        tagline,
        fb_url,
        insta_url,
        youtube_url,
        discord_url,
        twitter_url,
        greeting,
        possibleUserQuery,
        price,
        isFree,
        productToSell,
        goalType,
        webinarUrl,
        goalTitle,
        goalUrl,
        aiObjective,
        reassurance,
        validateConcerns,
        compromiseAndAlternatives,
        positiveRedirects,
        provideDetailedExplanation,
        calCalendarApiKey,
      } = req.body;

      const updateData = {};

      //console.log("URLS in request", {fb_url, insta_url, youtube_url, discord_url, twitter_url})
      let audio = null;
      if (req.files && req.files.media) {
        console.log("Audio in update AI");
        let file = req.files.media[0];

        const mediaBuffer = file.buffer;
        const mediaType = file.mimetype;
        const mediaExt = path.extname(file.originalname);
        const mediaFilename = `${Date.now()}${mediaExt}`;
        //console.log("There is a file uploaded");
        if (mediaType.includes("audio")) {
          // Ensure directories exist
          let dir = process.env.DocsDir; ///var/www/neo/neoapis/uploads
          const audioDir = path.join(dir + "/audios"); //path.join(__dirname, '../../uploads/images');
          //   const thumbnailDir = path.join(dir + "/thumbnails"); //path.join(__dirname, '../../uploads/thumbnails');
          ensureDirExists(audioDir);
          //   ensureDirExists(thumbnailDir);

          // Save audio
          const audioPath = path.join(audioDir, mediaFilename);
          fs.writeFileSync(audioPath, mediaBuffer);
          // image = `/uploads/images/${mediaFilename}`;
          audio = `https://www.blindcircle.com:444/voiceapp/uploads/audios/${mediaFilename}`;
          updateData.audio = audio;
        }
      }

      if (name !== null && name !== undefined) updateData.name = name;
      if (action !== null && action !== undefined) updateData.action = action;
      if (tagline !== null && tagline !== undefined)
        updateData.tagline = tagline;
      if (fb_url !== null && fb_url !== undefined) updateData.fbUrl = fb_url;
      if (insta_url !== null && insta_url !== undefined)
        updateData.instaUrl = insta_url;
      if (youtube_url !== null && youtube_url !== undefined)
        updateData.youtubeUrl = youtube_url;
      if (discord_url !== null && discord_url !== undefined)
        updateData.discordUrl = discord_url;
      if (twitter_url !== null && twitter_url !== undefined)
        updateData.twitterUrl = twitter_url;
      if (greeting !== null && greeting !== undefined)
        updateData.greeting = greeting;
      if (possibleUserQuery !== null && possibleUserQuery !== undefined)
        updateData.possibleUserQuery = possibleUserQuery;
      if (price !== null && price !== undefined) updateData.price = price;
      if (isFree !== null && isFree !== undefined) updateData.isFree = isFree;
      if (goalType !== null && goalType !== undefined)
        updateData.goalType = goalType;
      if (productToSell !== null && productToSell !== undefined)
        updateData.productToSell = productToSell;
      if (webinarUrl !== null && webinarUrl !== undefined)
        updateData.webinarUrl = webinarUrl;
      if (goalTitle !== null && goalTitle !== undefined)
        updateData.goalTitle = goalTitle;
      if (goalUrl !== null && goalUrl !== undefined)
        updateData.goalUrl = goalUrl;

      //objection handling
      if (reassurance !== null && reassurance !== undefined)
        updateData.reassurance = reassurance;
      if (validateConcerns !== null && validateConcerns !== undefined)
        updateData.validateConcerns = validateConcerns;
      if (
        compromiseAndAlternatives !== null &&
        compromiseAndAlternatives !== undefined
      )
        updateData.compromiseAndAlternatives = compromiseAndAlternatives;
      if (positiveRedirects !== null && positiveRedirects !== undefined)
        updateData.positiveRedirects = positiveRedirects;
      if (
        provideDetailedExplanation !== null &&
        provideDetailedExplanation !== undefined
      )
        updateData.provideDetailedExplanation = provideDetailedExplanation;

      if (calCalendarApiKey !== null && calCalendarApiKey !== undefined)
        updateData.calCalendarApiKey = calCalendarApiKey;
      // aiObjective
      if (aiObjective !== null && aiObjective !== undefined)
        updateData.aiObjective = aiObjective;

      //console.log("Data to update ", updateData)
      // Update the table in the database using Sequelize

      let createdAI = await db.UserAi.update(updateData, {
        where: {
          userId: authData.user.id,
        },
      });

      // if (createdAI) {
      //   user.username = name;
      //   let savedUser = await user.save();
      // }

      let questions = req.body.kycQuestions;
      if (questions && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          let p = questions[i];
          let questionId = p.questionId || null;
          if (questionId) {
            let data = { question: p.question, userId: userId };
            if (p.example1) {
              data = { ...data, example1: p.example1 };
            }
            if (p.example2) {
              data = { ...data, example2: p.example2 };
            }
            if (p.example3) {
              data = { ...data, example3: p.example3 };
            }
            let question = await db.KycQuestions.update(data, {
              where: {
                id: questionId,
              },
            });
            if (question) {
              console.log(`Question ${p.question} updated`);
            }
          } else {
            let questionCreated = await db.KycQuestions.create({
              question: p.question,
              userId: userId,
              example1: p.example1,
              example2: p.example2,
              example3: p.example3,
            });
            if (questionCreated) {
              console.log(`Question ${p.question} created`);
            }
          }
        }
      }

      let products = req.body.products;
      if (products && products.length > 0) {
        for (let i = 0; i < products.length; i++) {
          let p = products[i];
          let productId = p.productId || null;
          if (productId) {
            let pUpdated = await db.SellingProducts.update(
              {
                name: p.name,
                productPrice: p.productPrice,
                isSelling: p.isSelling,
              },
              {
                where: {
                  id: productId,
                },
              }
            );
          } else {
            let productCreated = await db.SellingProducts.create({
              name: p.name,
              productPrice: p.productPrice,
              userId: userId,
            });
          }
        }
      }

      let ai = await GetAiForUser(user.id);
      res.send({ status: true, message: "Ai Updated", data: ai });
    } else {
      res.send({ status: false, message: "Unauthenticated User" });
    }
  });
};

export const DeleteKyc = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      let kycToDel = req.body.kycId;
      let del = await db.KycQuestions.destroy({
        where: {
          id: kycToDel,
        },
      });
      res.send({ status: true, message: "KYC base removed", data: null });
    } else {
      res.send({ status: false, message: "Unauthenticated User" });
    }
  });
};

export const DeleteKb = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      let kbToDel = req.body.kbId;
      let del = await db.KnowledgeBase.destroy({
        where: {
          id: kbToDel,
        },
      });
      res.send({ status: true, message: "Knowledge base removed", data: null });
    } else {
      res.send({ status: false, message: "Unauthenticated User" });
    }
  });
};

export async function AddKnowledgebase(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let type = req.body.type;
    let description = req.body.description;
    let content = req.body.content; // Default content from request body
    let name = req.body.name || ""; //Name of document
    let pdf = null;

    if (req.files && req.files.media) {
      let file = req.files.media[0];

      const mediaBuffer = file.buffer;
      const mediaType = file.mimetype;
      const mediaExt = path.extname(file.originalname);
      const mediaFilename = `${Date.now()}${mediaExt}`;

      // Ensure directories exist
      let dir = process.env.DocsDir; // e.g., /var/www/neo/neoapis/uploads
      const docsDir = path.join(dir + "/documents");
      ensureDirExists(docsDir);

      // Save the uploaded file
      const docPath = path.join(docsDir, mediaFilename);
      fs.writeFileSync(docPath, mediaBuffer);
      pdf = `https://www.blindcircle.com:444/voiceapp/uploads/documents/${mediaFilename}`;

      // Extract text from the uploaded file based on its type
      if (mediaType.includes("pdf")) {
        try {
          const extracted = await pdfExtract(mediaBuffer);
          content = extracted.text.trim(); // Extract and assign content from PDF
        } catch (err) {
          console.error("Error extracting text from PDF:", err);
          return res
            .status(500)
            .send({ status: false, message: "Error processing PDF file." });
        }
      } else if (mediaType.includes("docx") || mediaType.includes("doc")) {
        try {
          const result = await mammoth.extractRawText({ buffer: mediaBuffer });
          content = result.value.trim(); // Extract and assign content from DOCX
        } catch (err) {
          console.error("Error extracting text from DOCX:", err);
          return res
            .status(500)
            .send({ status: false, message: "Error processing DOCX file." });
        }
      } else if (mediaType.includes("text") || mediaExt.includes(".txt")) {
        try {
          content = mediaBuffer.toString("utf8"); // Extract and assign content from TXT
        } catch (err) {
          console.error("Error reading text file:", err);
          return res
            .status(500)
            .send({ status: false, message: "Error processing text file." });
        }
      }
    }

    // Create the knowledge base entry in the database
    try {
      let kbcreated = await db.KnowledgeBase.create({
        type: type,
        content: content, // Use the extracted or default text content
        documentUrl: pdf,
        description: description,
        userId: userId,
        name: name,
      });

      if (kbcreated) {
        return res.send({
          status: true,
          message: "Knowledge base added",
          data: kbcreated,
        });
      }
    } catch (dbError) {
      console.error("Error creating KnowledgeBase entry:", dbError);
      return res
        .status(500)
        .send({ status: false, message: "Error saving KnowledgeBase entry." });
    }
  });
}

//Personality Traits
export async function AddTrait(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { trait, score } = req.body;
    let added = await db.PersonalityTrait.create({
      trait: trait,
      score: score,
      userId: userId,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({ status: true, message: "Trait added", data: ai });
    } else {
      return res.send({
        status: false,
        message: "Trait not added",
        data: null,
      });
    }
  });
}

export async function DeleteTrait(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.PersonalityTrait.findByPk(id);
    let del = await db.PersonalityTrait.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({ status: true, message: "Trait deleted", data: ai });
    } else {
      return res.send({
        status: false,
        message: "Trait not deleted",
        data: null,
      });
    }
  });
}

export async function UpdateTrait(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.PersonalityTrait.findByPk(id);

    if (req.body.trait) {
      trait.trait = req.body.trait;
    }
    if (req.body.score) {
      trait.score = req.body.score;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({ status: true, message: "Trait saved", data: ai });
  });
}

//Frameworks And Techniques
export async function AddFramework(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { title, description } = req.body;
    let added = await db.FrameworkAndTechnique.create({
      title: title,
      description: description,
      userId: userId,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Framework added",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Framework not added",
        data: null,
      });
    }
  });
}

export async function DeleteFramework(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.FrameworkAndTechnique.findByPk(id);
    let del = await db.FrameworkAndTechnique.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Framework deleted",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Framework not deleted",
        data: null,
      });
    }
  });
}

export async function UpdateFramework(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.FrameworkAndTechnique.findByPk(id);

    if (req.body.title) {
      trait.title = req.body.title;
    }
    if (req.body.description) {
      trait.description = req.body.description;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({ status: true, message: "Framework saved", data: ai });
  });
}

//User Values
export async function AddUserValue(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { title, description } = req.body;
    let added = await db.UserValues.create({
      title: title,
      description: description,
      userId: userId,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Listing added",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Listing not added",
        data: null,
      });
    }
  });
}

export async function DeleteUserValue(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.UserValues.findByPk(id);
    let del = await db.UserValues.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Listing deleted",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Listing not deleted",
        data: null,
      });
    }
  });
}

export async function UpdateUserValue(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.UserValues.findByPk(id);

    if (req.body.title) {
      trait.title = req.body.title;
    }
    if (req.body.description) {
      trait.description = req.body.description;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({ status: true, message: "Listing saved", data: ai });
  });
}

export async function AddPhilosophyAndViews(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { title, description } = req.body;
    let added = await db.UserPhilosophyAndViews.create({
      description: description,
      title: title,
      userId: userId,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({ status: true, message: "Listing added", data: ai });
    } else {
      return res.send({
        status: false,
        message: "Listing not added",
        data: null,
      });
    }
  });
}

export async function DeletePhilosophyAndViews(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.UserPhilosophyAndViews.findByPk(id);
    let del = await db.UserPhilosophyAndViews.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Listing deleted",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Listing not deleted",
        data: null,
      });
    }
  });
}

export async function UpdateUserPhilosophyAndViews(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.UserPhilosophyAndViews.findByPk(id);

    if (req.body.title) {
      trait.title = req.body.title;
    }
    if (req.body.description) {
      trait.description = req.body.description;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({ status: true, message: "Listing saved", data: ai });
  });
}

//User Beliefs
export async function AddUserBelief(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { title, description } = req.body;
    let added = await db.UserBeliefs.create({
      title: title,
      description: description,
      userId: userId,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Listing added",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Listing not added",
        data: null,
      });
    }
  });
}

export async function DeleteUserBelief(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.UserBeliefs.findByPk(id);
    let del = await db.UserBeliefs.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Listing deleted",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Listing not deleted",
        data: null,
      });
    }
  });
}

export async function UpdateUserBelief(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.UserBeliefs.findByPk(id);

    if (req.body.title) {
      trait.title = req.body.title;
    }
    if (req.body.description) {
      trait.description = req.body.description;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({ status: true, message: "Listing saved", data: ai });
  });
}

//Intraction Examples
export async function AddIntractionExample(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { question, answer } = req.body;
    let added = await db.IntractionExample.create({
      question: question,
      answer: answer,
      userId: userId,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Listing added",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Listing not added",
        data: null,
      });
    }
  });
}

export async function DeleteIntractionExample(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.IntractionExample.findByPk(id);
    let del = await db.IntractionExample.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Listing deleted",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Listing not deleted",
        data: null,
      });
    }
  });
}

export async function UpdateIntractionExample(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.IntractionExample.findByPk(id);

    if (req.body.question) {
      trait.question = req.body.question;
    }
    if (req.body.answer) {
      trait.answer = req.body.answer;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({ status: true, message: "Listing saved", data: ai });
  });
}

//Do not Discuss
export async function AddDonotDiscuss(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { description } = req.body;
    let added = await db.DonotDiscuss.create({
      description: description,

      userId: userId,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Listing added",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Listing not added",
        data: null,
      });
    }
  });
}

export async function DeleteDonotDiscuss(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.DonotDiscuss.findByPk(id);
    let del = await db.DonotDiscuss.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Listing deleted",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Listing not deleted",
        data: null,
      });
    }
  });
}

export async function UpdateDonotDiscuss(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.DonotDiscuss.findByPk(id);

    if (req.body.description) {
      trait.description = req.body.description;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({ status: true, message: "Listing saved", data: ai });
  });
}

//Phrases And Quotes
export async function AddPhrasesAndQuotes(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { title, description } = req.body;
    let added = await db.PhrasesAndQuotes.create({
      description: description,
      title: title,
      userId: userId,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Listing added",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Listing not added",
        data: null,
      });
    }
  });
}

export async function DeletePhrasesAndQuotes(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.PhrasesAndQuotes.findByPk(id);
    let del = await db.PhrasesAndQuotes.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Listing deleted",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Listing not deleted",
        data: null,
      });
    }
  });
}

export async function UpdatePhrasesAndQuotes(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.PhrasesAndQuotes.findByPk(id);

    if (req.body.description) {
      trait.description = req.body.description;
    }

    if (req.body.title) {
      trait.title = req.body.title;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({ status: true, message: "Listing saved", data: ai });
  });
}

//CommunicationInstruction
export async function AddCommunicationInstruction(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { tone, pacing, intonation, scenario, prompt, response } = req.body;
    let added = await db.CommunicationInstructions.create({
      tone: tone,
      pacing: pacing,
      userId: userId,
      intonation: intonation,
      scenario: scenario,
      prompt: prompt,
      response: response,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Listing added",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Listing not added",
        data: null,
      });
    }
  });
}

export async function DeleteCommunicationInstruction(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.CommunicationInstructions.findByPk(id);
    let del = await db.CommunicationInstructions.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Listing deleted",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Listing not deleted",
        data: null,
      });
    }
  });
}

export async function UpdateCommunicationInstruction(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.CommunicationInstructions.findByPk(id);

    if (req.body.intonation) {
      trait.intonation = req.body.intonation;
    }
    if (req.body.pacing) {
      trait.pacing = req.body.pacing;
    }
    if (req.body.tone) {
      trait.tone = req.body.tone;
    }
    if (req.body.prompt) {
      trait.prompt = req.body.prompt;
    }
    if (req.body.response) {
      trait.response = req.body.response;
    }
    if (req.body.scenario) {
      trait.scenario = req.body.scenario;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({ status: true, message: "Listing saved", data: ai });
  });
}

export async function AddCallStrategy(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { title, description } = req.body;
    let added = await db.CallStrategy.create({
      title: title,
      description: description,
      userId: userId,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "CallStrategy added",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "CallStrategy not added",
        data: null,
      });
    }
  });
}

export async function DeleteCallStrategy(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.CallStrategy.findByPk(id);
    let del = await db.CallStrategy.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "CallStrategy deleted",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "CallStrategy not deleted",
        data: null,
      });
    }
  });
}

export async function UpdateCallStrategy(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.CallStrategy.findByPk(id);

    if (req.body.title) {
      trait.title = req.body.title;
    }
    if (req.body.description) {
      trait.description = req.body.description;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({ status: true, message: "CallStrategy saved", data: ai });
  });
}

export async function AddObjectionHandling(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { prompt, response, objectinType } = req.body;
    let added = await db.ObjectionHandling.create({
      prompt: prompt,
      response: response,
      objectinType: objectinType,
      userId: userId,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "ObjectionHandling added",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "ObjectionHandling not added",
        data: null,
      });
    }
  });
}

export async function DeleteObjectionHandling(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.ObjectionHandling.findByPk(id);
    let del = await db.ObjectionHandling.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "ObjectionHandling deleted",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "ObjectionHandling not deleted",
        data: null,
      });
    }
  });
}

export async function UpdateObjectionHandling(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.ObjectionHandling.findByPk(id);

    if (req.body.prompt) {
      trait.prompt = req.body.prompt;
    }
    if (req.body.response) {
      trait.response = req.body.response;
    }
    if (req.body.objectinType) {
      trait.objectinType = req.body.objectinType;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({
      status: true,
      message: "ObjectionHandling saved",
      data: ai,
    });
  });
}

//Demeanor
export async function AddDemeanor(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { title, description } = req.body;
    let added = await db.UserDemeanor.create({
      title: title,
      description: description,
      userId: userId,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Demeanor added",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Demeanor not added",
        data: null,
      });
    }
  });
}

export async function DeleteDemeanor(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.UserDemeanor.findByPk(id);
    let del = await db.UserDemeanor.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "UserDemeanor deleted",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "UserDemeanor not deleted",
        data: null,
      });
    }
  });
}

export async function UpdateDemeanor(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.UserDemeanor.findByPk(id);

    if (req.body.title) {
      trait.title = req.body.title;
    }
    if (req.body.description) {
      trait.description = req.body.description;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({ status: true, message: "UserDemeanor saved", data: ai });
  });
}

//Interpersonal Skills
export async function AddInterpersonalSkills(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { title, description } = req.body;
    let added = await db.InterpersonalSkills.create({
      title: title,
      description: description,
      userId: userId,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "InterpersonalSkills added",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "InterpersonalSkills not added",
        data: null,
      });
    }
  });
}

export async function DeleteInterpersonalSkills(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.InterpersonalSkills.findByPk(id);
    let del = await db.InterpersonalSkills.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "InterpersonalSkills deleted",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "InterpersonalSkills not deleted",
        data: null,
      });
    }
  });
}

export async function UpdateInterpersonalSkills(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.InterpersonalSkills.findByPk(id);

    if (req.body.title) {
      trait.title = req.body.title;
    }
    if (req.body.description) {
      trait.description = req.body.description;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({
      status: true,
      message: "InterpersonalSkills saved",
      data: ai,
    });
  });
}

//Product FAQs
export async function AddProductFaqs(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { question, answer } = req.body;
    let added = await db.ProductFaqs.create({
      question: question,
      answer: answer,
      userId: userId,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "ProductFaqs added",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "ProductFaqs not added",
        data: null,
      });
    }
  });
}

export async function DeleteProductFaqs(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.ProductFaqs.findByPk(id);
    let del = await db.ProductFaqs.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "ProductFaqs deleted",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "ProductFaqs not deleted",
        data: null,
      });
    }
  });
}

export async function UpdateProductFaqs(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.ProductFaqs.findByPk(id);

    if (req.body.question) {
      trait.question = req.body.question;
    }
    if (req.body.answer) {
      trait.answer = req.body.answer;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({
      status: true,
      message: "Product FAQs saved",
      data: ai,
    });
  });
}

//Common questions | Communication FAQs
export async function AddCommunicationCommonFaqs(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { question, answer } = req.body;
    let added = await db.CommunicationCommonFaqs.create({
      question: question,
      answer: answer,
      userId: userId,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "CommonQuestion added",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "CommonQuestion not added",
        data: null,
      });
    }
  });
}

export async function DeleteCommunicationCommonFaqs(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.CommunicationCommonFaqs.findByPk(id);
    let del = await db.CommunicationCommonFaqs.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "ProductFaqs deleted",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "ProductFaqs not deleted",
        data: null,
      });
    }
  });
}

export async function UpdateCommunicationCommonFaqs(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.CommunicationCommonFaqs.findByPk(id);

    if (req.body.question) {
      trait.question = req.body.question;
    }
    if (req.body.answer) {
      trait.answer = req.body.answer;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({
      status: true,
      message: "CommunicationCommonFaqs saved",
      data: ai,
    });
  });
}

//CommunicationStyle
export async function AddCommunicationStyle(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { title, description } = req.body;
    let added = await db.CommunicationStyle.create({
      title: title,
      description: description,
      userId: userId,
      type: "manual",
    });
    if (added) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Listing added",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Listing not added",
        data: null,
      });
    }
  });
}

export async function DeleteCommunicationStyle(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.CommunicationStyle.findByPk(id);
    let del = await db.CommunicationStyle.destroy({
      where: {
        id: id,
      },
    });
    if (del) {
      let ai = await GetAiForUser(userId);
      return res.send({
        status: true,
        message: "Listing deleted",
        data: ai,
      });
    } else {
      return res.send({
        status: false,
        message: "Listing not deleted",
        data: null,
      });
    }
  });
}

export async function UpdateCommunicationStyle(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (error) {
      return res.send({ status: false, message: "Unauthenticated User" });
    }

    let userId = authData.user.id;
    let { id } = req.body;
    let trait = await db.CommunicationStyle.findByPk(id);

    if (req.body.title) {
      trait.title = req.body.title;
    }
    if (req.body.description) {
      trait.description = req.body.description;
    }

    let saved = await trait.save();
    let ai = await GetAiForUser(userId);
    return res.send({ status: true, message: "Listing saved", data: ai });
  });
}
