// import verifyJwtToken from "../middleware/jwtmiddleware"
import JWT from 'jsonwebtoken'
import db from "../models/index.js"


import fs from 'fs';
import path from 'path';
import { generateThumbnail, ensureDirExists } from '../utils/generateThumbnail.js';
import { create } from 'domain';

export const BuildYourAi = async(req, res)=> {
    JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
        if (authData) {
            let userId = authData.user.id;
            let {name, action, tagline, } = req.body;
            
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


              let createdAI = await db.UserAi.create({
                name: name, 
                action: action,
                tagline: tagline,
                audio: audio,
                userId: userId
              })
              
              res.send({status: true, message: "Ai created", data: createdAI})

        }
        else{
            res.send({status: false, message: "Unauthenticated User"})
        }
    })
}



export const BuildAiScript = async(req, res)=> {
    JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
        if (authData) {
            let userId = authData.user.id;
            let products = req.body.products;
            let {greeting, possibleUserQuery, price, isFree} = req.body;
            let questions = req.body.kycQuestions;
            // let price = req.body.productPrice


              let createdAI = await db.UserAi.findOne({
                where:{
                    userId: userId
                }
              })
              if(createdAI){
                createdAI.greeting = greeting;
                    createdAI.possibleUserQuery = possibleUserQuery;
                    createdAI.price = price;
                    createdAI.isFree = isFree;

                    let saved = await createdAI.save();
                if(createdAI && questions && questions.length > 0){
                    
                
                    for(let i = 0; i < questions.length; i++){
                        let p = questions[i]
                        let questionCreated = await db.KycQuestions.create(
                            {
                                question: p.question,
                                userId: userId
                            }
                        )
                        if(questionCreated){
                            console.log(`Question ${p.question} created`)
                        }
                    }
                  }

                  if(products && products.length > 0){
                
                    for(let i = 0; i < products.length; i++){
                        let p = products[i]
                        let productCreated = await db.SellingProducts.create(
                            {
                                name: p.name,
                                productPrice: p.productPrice,
                                userId: userId
                            }
                        )
                    }
                  }
                  res.send({status: true, message: "Ai updated", data: createdAI})
              }
              else{
                res.send({status: false, message: "Build AI Step incomplete", data: null})
              }
              

        }
        else{
            res.send({status: false, message: "Unauthenticated User"})
        }
    })
}