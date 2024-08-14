import express from 'express'
import { LoginUser, SendPhoneVerificationCode, VerifyPhoneCode, CheckPhoneExists } from '../controllers/user.controller.js'

import { StoreToDb, SearchDb } from '../controllers/knowledge.controller.js';


let UserRouter = express.Router()


UserRouter.post("/login", LoginUser);
UserRouter.post("/checkPhoneNumber", CheckPhoneExists);
UserRouter.post("/sendVerificationCode", SendPhoneVerificationCode);
UserRouter.post("/verifyCode", VerifyPhoneCode);

UserRouter.post("/store", StoreToDb);

UserRouter.get("/search", SearchDb);


export default UserRouter
