// import verifyJwtToken from "../middleware/jwtmiddleware"
import JWT from "jsonwebtoken";
import db from "../models/index.js";

// import pdfParse from 'pdf-parse';

import pdfExtract from 'pdf-extraction';
import fs from "fs";
import path from "path";
import {
  generateThumbnail,
  ensureDirExists,
} from "../utils/generateThumbnail.js";
import { create } from "domain";
import { createProductAndPaymentLink } from "../services/stripe.js";

export const BuildYourAi = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      let { name, action, tagline, fb_url, insta_url, youtube_url, discord_url, twitter_url, 
        
       } = req.body;

       console.log("URLS in request", {fb_url, insta_url, youtube_url, discord_url, twitter_url})
      let audio = null;
      if (req.files.media) {
        let file = req.files.media[0];

        const mediaBuffer = file.buffer;
        const mediaType = file.mimetype;
        const mediaExt = path.extname(file.originalname);
        const mediaFilename = `${Date.now()}${mediaExt}`;
        console.log("There is a file uploaded");
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
      let { greeting, possibleUserQuery, price, isFree, goalType, productToSell, webinarUrl, goalTitle, goalUrl } = req.body;
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

        let saved = await createdAI.save();
        if (createdAI && questions && questions.length > 0) {
          for (let i = 0; i < questions.length; i++) {
            let p = questions[i];
            let questionCreated = await db.KycQuestions.create({
              question: p.question,
              userId: userId,
            });
            if (questionCreated) {
              console.log(`Question ${p.question} created`);
            }
          }
        }

        if (products && products.length > 0) {
          for (let i = 0; i < products.length; i++) {
            let p = products[i];
            let stripeProduct = await createProductAndPaymentLink(userId, p.name, `Buy ${p.name} at $${p.productPrice}`, Number(p.productPrice), 'image')
            let productCreated = await db.SellingProducts.create({
              name: p.name,
              productPrice: p.productPrice,
              userId: userId,
              stripeProductId: stripeProduct.productId,
              stripePriceId: stripeProduct.priceId,
              stripePaymentLink: stripeProduct.paymentLink,
            });
            

            if(p.name == productToSell){
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
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      let { name, action, tagline, fb_url, insta_url, youtube_url, discord_url, twitter_url, 
        greeting, possibleUserQuery, price, isFree, productToSell, goalType, webinarUrl, goalTitle, goalUrl 
       } = req.body;

       console.log("URLS in request", {fb_url, insta_url, youtube_url, discord_url, twitter_url})
      let audio = null;
      if (req.files.media) {
        let file = req.files.media[0];

        const mediaBuffer = file.buffer;
        const mediaType = file.mimetype;
        const mediaExt = path.extname(file.originalname);
        const mediaFilename = `${Date.now()}${mediaExt}`;
        console.log("There is a file uploaded");
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
          audio = `https://www.blindcircle.com:444/neo/uploads/audios/${mediaFilename}`;
          // Generate and save thumbnail
        }
      }


      const updateData = {};
        
        if (name !== null && name !== undefined) updateData.name = name;
        if (action !== null && action !== undefined) updateData.action = action;
        if (tagline !== null && tagline !== undefined) updateData.tagline = tagline;
        if (fb_url !== null && fb_url !== undefined) updateData.fbUrl = fb_url;
        if (insta_url !== null && insta_url !== undefined) updateData.instaUrl = insta_url;
        if (youtube_url !== null && youtube_url !== undefined) updateData.youtubeUrl = youtube_url;
        if (discord_url !== null && discord_url !== undefined) updateData.discordUrl = discord_url;
        if (twitter_url !== null && twitter_url !== undefined) updateData.twitterUrl = twitter_url;
        if (greeting !== null && greeting !== undefined) updateData.greeting = greeting;
        if (possibleUserQuery !== null && possibleUserQuery !== undefined) updateData.possibleUserQuery = possibleUserQuery;
        if (price !== null && price !== undefined) updateData.price = price;
        if (isFree !== null && isFree !== undefined) updateData.isFree = isFree;
        if (goalType !== null && goalType !== undefined) updateData.goalType = goalType;
        if (productToSell !== null && productToSell !== undefined) updateData.productToSell = productToSell;
        if (webinarUrl !== null && webinarUrl !== undefined) updateData.webinarUrl = webinarUrl;
        if (goalTitle !== null && goalTitle !== undefined) updateData.goalTitle = goalTitle;
        if (goalUrl !== null && goalUrl !== undefined) updateData.goalUrl = goalUrl;

        console.log("Data to update ", updateData)
        // Update the table in the database using Sequelize

      let createdAI = await db.UserAi.update(updateData, {
        where: {
          userId: authData.user.id
        }
      });


      let questions = req.body.kycQuestions;
      if (questions && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          let p = questions[i];
          let questionId = p.questionId || null
          if(questionId){
            let question = await db.KycQuestions.update({question: p.question, userId: userId}, {
              where: {
                id: questionId
              }
            })
            if (question) {
              console.log(`Question ${p.question} updated`);
            }
          }
          else{
            let questionCreated = await db.KycQuestions.create({
              question: p.question,
              userId: userId,
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
          if(productId){
            let pUpdated = await db.SellingProducts.update({name: p.name,
              productPrice: p.productPrice,}, {
              where: {
                id: productId
              }
            })
          }
          else{
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



export const DeleteKb = async(req, res)=> {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      let kbToDel = req.body.kbId;
      let del = await db.KnowledgeBase.destroy({
        where: {
          id: kbToDel
        }
      })
      res.send({ status: true, message: "Knowledge base removed", data: null });
    }
    else {
      res.send({ status: false, message: "Unauthenticated User" });
    }
  })
}



export async function AddKnowledgebase(req, res) {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      let type = req.body.type;
      let content = req.body.content;  // Default content from request body
      let pdf = null;

      if (req.files && req.files.media) {
        let file = req.files.media[0];

        const mediaBuffer = file.buffer;
        const mediaType = file.mimetype;
        const mediaExt = path.extname(file.originalname);
        const mediaFilename = `${Date.now()}${mediaExt}`;
        console.log("There is a file uploaded");

        // Ensure directories exist
        let dir = process.env.DocsDir; // e.g., /var/www/neo/neoapis/uploads
        const docsDir = path.join(dir + "/documents");
        ensureDirExists(docsDir);

        // Save the PDF file
        const docPath = path.join(docsDir, mediaFilename);
        fs.writeFileSync(docPath, mediaBuffer);
        pdf = `https://www.blindcircle.com:444/voiceapp/uploads/documents/${mediaFilename}`;
        console.log("Pdf uploaded is ", pdf);

        // If the file is a PDF, extract text from it using pdf-extraction
        if (mediaType.includes("pdf")) {
          try {
            const extracted = await pdfExtract(mediaBuffer);
            content = extracted.text.trim(); // Extract text and trim whitespace
            console.log("Extracted text from PDF:", content);
          } catch (err) {
            console.error("Error extracting text from PDF:", err);
            return res.status(500).send({ status: false, message: "Error processing PDF file." });
          }
        }
      }

      // Create the knowledge base entry
      let kbcreated = await db.KnowledgeBase.create({
        type: type,
        content: content, // Use the extracted text content
        documentUrl: pdf,
        userId: userId,
      });

      if (kbcreated) {
        res.send({
          status: true,
          message: "Knowledge base added",
          data: kbcreated,
        });
      }
    } else {
      res.send({ status: false, message: "Unauthenticated User" });
    }
  });
}
