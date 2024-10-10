// import verifyJwtToken from "../middleware/jwtmiddleware"
import JWT from "jsonwebtoken";
import db from "../models/index.js";
import mammoth from "mammoth";
import { CallOpenAi } from "../services/gptService.js";

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

export const MyAi = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
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
      res.send({
        status: true,
        data: {
          ai: ai,
          kb: kb,
          products: products,
          questions: questions,
          traits: personalityTraits,
          beliefs: beliefs,
          values: Values,
          frameworks: Frameworks,
          intractions: intractions,
        },
        message: "My AI",
      });
    } else {
      res.send({ status: false, data: null, message: "Unauthenticated user" });
    }
  });
};
export const BuildYourAi = async (req, res) => {
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

      user.username = name;
      let userSaved = await user.save();
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
        productToSell,
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
            });

            if (p.name == productToSell) {
              createdAI.productToSell = productCreated.id;
              await createdAI.save();
            }
          }
        }
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
      } = req.body;

      const updateData = {};

      //console.log("URLS in request", {fb_url, insta_url, youtube_url, discord_url, twitter_url})
      let audio = null;
      if (req.files.media) {
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

      //console.log("Data to update ", updateData)
      // Update the table in the database using Sequelize

      let createdAI = await db.UserAi.update(updateData, {
        where: {
          userId: authData.user.id,
        },
      });

      if (createdAI) {
        user.username = name;
        let savedUser = await user.save();
      }

      let questions = req.body.kycQuestions;
      if (questions && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          let p = questions[i];
          let questionId = p.questionId || null;
          if (questionId) {
            let question = await db.KycQuestions.update(
              { question: p.question, userId: userId },
              {
                where: {
                  id: questionId,
                },
              }
            );
            if (question) {
              //console.log(`Question ${p.question} updated`);
            }
          } else {
            let questionCreated = await db.KycQuestions.create({
              question: p.question,
              userId: userId,
            });
            if (questionCreated) {
              //console.log(`Question ${p.question} created`);
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
              { name: p.name, productPrice: p.productPrice },
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

      res.send({ status: true, message: "Ai Updated", data: createdAI });
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
      return res.send({ status: true, message: "Trait added", data: added });
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
      return res.send({ status: true, message: "Trait deleted", data: null });
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
    return res.send({ status: true, message: "Trait saved", data: trait });
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
      return res.send({
        status: true,
        message: "Framework added",
        data: added,
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
      return res.send({
        status: true,
        message: "Framework deleted",
        data: null,
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
    return res.send({ status: true, message: "Framework saved", data: trait });
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
      return res.send({
        status: true,
        message: "Listing added",
        data: added,
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
      return res.send({
        status: true,
        message: "Listing deleted",
        data: null,
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
    return res.send({ status: true, message: "Listing saved", data: trait });
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
      return res.send({
        status: true,
        message: "Listing added",
        data: added,
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
      return res.send({
        status: true,
        message: "Listing deleted",
        data: null,
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
    return res.send({ status: true, message: "Listing saved", data: trait });
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
      return res.send({
        status: true,
        message: "Listing added",
        data: added,
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
      return res.send({
        status: true,
        message: "Listing deleted",
        data: null,
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
    if (req.body.anwer) {
      trait.anwer = req.body.anwer;
    }

    let saved = await trait.save();
    return res.send({ status: true, message: "Listing saved", data: trait });
  });
}

export async function KbProcessingCron() {
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
      let prompt = `Take in the text provided and process it to fetch the following information in a json format. JSON format
        is provided below with the structure and keys required to extract from the text.
        
        Here is the text: ${kb.content}
        
        Here is the JSON Format we need. 
        {
    "PersonaCharacteristics": {
        "Profession": "Customer Support Representative",
        "PersonalBackgroundAndValues": {
            "Education": "Bachelor's in Communication",
            "Hobbies": ["Reading", "Traveling", "Volunteering"],
            "CoreValues": ["Empathy", "Integrity", "Responsibility"]
        },
        "PersonalityTraits": {
            "Primary": "Empathetic",
            "Secondary": ["Patient", "Optimistic", "Detail-oriented"]
        },
        "PhilosophyAndViews": {
            "CustomerServicePhilosophy": "Always prioritize the customer's needs, while balancing company goals.",
            "Worldview": "Believes in making meaningful connections and providing value in every interaction."
        }
    },
    "Communication": {
        "CommunicationInstructions": {
            "Tone": "Friendly, Calm, Supportive",
            "Instructions": "Always acknowledge the customer's concerns first, and ask clarifying questions before providing a solution."
        },
        "SampleCommunication": {
            "Greeting": "Hi there! How can I assist you today?",
            "IssueAcknowledgement": "I completely understand how frustrating that must be, and I’m here to help."
        },
        "Demeanor": "Calm, friendly, and patient, especially during stressful situations.",
        "InterpersonalSkills": ["Active listening", "Conflict resolution", "Empathy"],
        "CommunicationStyle": "Direct and concise, using simple language and providing step-by-step guidance.",
        "InteractionExamples": {
            "IssueResolution": "If the customer reports a delay in service, acknowledge the delay, provide the reason if available, and offer compensation or solution options.",
            "TechnicalIssue": "Explain troubleshooting steps in simple terms, guiding them step by step."
        },
        "ShortPhrases": ["I’m happy to assist.", "Let’s work through this together.", "I understand where you're coming from."],
        "HowToExplainComplexConcepts": "Break down the concept into smaller steps, using analogies where necessary, and check for understanding frequently."
    },
    "SpecificStrategiesAndTechniques": {
        "ProductAndServices": "Explain the benefits of using the product, offer demonstrations, and address common pain points.",
        "ObjectionHandling": "Use empathy to validate concerns, provide relevant solutions, and offer alternative benefits."
    },
    "GetTools": {
        "KnowledgeBase": "Access to the internal database with FAQs and troubleshooting guides.",
        "GetAvailability": "Check system availability or resource availability for the customer.",
        "CreateBooking": "Schedule appointments or callbacks directly from the system.",
        "GetConversationData": "Retrieve previous conversation logs for context."
    },
    "ImportantThingsToApplyDuringTheCall": {
        "GeneralGuidelines": ["Be empathetic", "Maintain professionalism", "Stay solution-focused", "Document important points clearly"]
    },
    "ObjectiveOfTheAiDuringTheCall": "The AI aims to resolve the customer's query efficiently, while ensuring a positive experience and reducing the need for follow-up calls.",
    "CallInstructions": {
        "Greeting": "Start with a warm, personalized greeting.",
        "ProblemIdentification": "Ask open-ended questions to understand the issue thoroughly.",
        "SolutionOffering": "Provide a clear solution or alternative options, and verify that the customer is satisfied.",
        "Closing": "End the call by summarizing the steps taken and reassuring the customer that their issue has been addressed."
    }
}
      Instruction:
        Make sure the output text is only json object. No extra description or any senetences 
        or words. Only Json object so that we can parse it and use it in our code base.`;

      let result = await CallOpenAi(prompt);
      if (result.status) {
        let content = result.message;
        content = content.replace(new RegExp("```json", "g"), "");
        content = content.replace(new RegExp("```", "g"), "");
        content = content.replace(new RegExp("\n", "g"), "");
        kb.processedData = content;
        kb.processed = true;
        let saved = await kb.save();

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
