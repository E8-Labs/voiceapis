import express from 'express'
import multer from 'multer';
import { 
    BuildYourAi, BuildAiScript
 } from '../controllers/buildai.controller.js'

import {verifyJwtToken} from '../middleware/jwtmiddleware.js'
const uploadFiles = multer().fields([
    { name: 'media', maxCount: 1 }
  ]);


let AiRouter = express.Router()


AiRouter.post("/buildAi", verifyJwtToken, uploadFiles, BuildYourAi);
AiRouter.post("/buildAiScript", verifyJwtToken, uploadFiles, BuildAiScript);





export default AiRouter
