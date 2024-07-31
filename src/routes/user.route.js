import express from 'express'
import { LoginUser } from '../controllers/user.controller.js'

import { StoreToDb, SearchDb } from '../controllers/knowledge.controller.js';


let UserRouter = express.Router()


UserRouter.post("/login", LoginUser);

UserRouter.post("/store", StoreToDb);

UserRouter.get("/search", SearchDb);


export default UserRouter
