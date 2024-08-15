import express from 'express'
import { LoginUser, SendPhoneVerificationCode, VerifyPhoneCode, CheckPhoneExists } from '../controllers/user.controller.js'

import { StoreToDb, SearchDb } from '../controllers/knowledge.controller.js';
import { AddCard, GetUserPaymentSources, DownloadInvoice, GetTransactions } from '../controllers/paymentController.js';
import {verifyJwtToken} from '../middleware/jwtmiddleware.js'

let UserRouter = express.Router()


UserRouter.post("/login", LoginUser);
UserRouter.post("/checkPhoneNumber", CheckPhoneExists);
UserRouter.post("/sendVerificationCode", SendPhoneVerificationCode);
UserRouter.post("/verifyCode", VerifyPhoneCode);

UserRouter.post("/store", StoreToDb);

UserRouter.get("/search", SearchDb);




//Payment
UserRouter.post("/add_card", verifyJwtToken, AddCard);
UserRouter.get("/get_transactions", verifyJwtToken, GetTransactions);
UserRouter.get("/list_cards", verifyJwtToken, GetUserPaymentSources);


export default UserRouter
