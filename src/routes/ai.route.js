import express from 'express'
import multer from 'multer';
import { 
    BuildYourAi
 } from '../controllers/buildai.controller.js'

import {verifyJwtToken} from '../middleware/jwtmiddleware.js'
const uploadFiles = multer().fields([
    { name: 'media', maxCount: 1 }
  ]);


let AiRouter = express.Router()


AiRouter.post("/buildAi", verifyJwtToken, uploadFiles, BuildYourAi);





export default AiRouter
