import express from 'express'
import {verifyJwtToken} from '../middleware/jwtmiddleware.js'
import { LoginUser, SendPhoneVerificationCode, VerifyPhoneCode, CheckPhoneExists, UpdateUserToCreator,
    CheckUsernameExists, CheckEmailExists, GetProfileWithUsername, SendEmailVerificationCode, VerifyEmailCode
 } from '../controllers/user.controller.js'

import { StoreToDb, SearchDb } from '../controllers/knowledge.controller.js';
import { AddCard, GetUserPaymentSources, DownloadInvoice, GetTransactions, subscribeUser, CancelSubscription } from '../controllers/paymentController.js';

import { AddInstagramAuth, AddGoogleAuth } from '../controllers/socialauth.controller.js';

import { CreateWebHook, SubscriptionUpdated } from "../services/stripe.js";
import { CreatorDashboard } from '../controllers/profile.controller.js';


let UserRouter = express.Router()


UserRouter.post("/login", LoginUser);
UserRouter.post("/updateUserRole", verifyJwtToken, UpdateUserToCreator);
UserRouter.post("/checkPhoneNumber", CheckPhoneExists);
UserRouter.post("/checkUsernameExists", CheckUsernameExists);
UserRouter.get("/getProfileFromUsername", GetProfileWithUsername);
UserRouter.post("/checkEmailExists", CheckEmailExists);
UserRouter.post("/sendVerificationCode", SendPhoneVerificationCode);
UserRouter.post("/verifyCode", VerifyPhoneCode);

UserRouter.post("/sendVerificationEmail", SendEmailVerificationCode);
UserRouter.post("/verifyEmail", VerifyEmailCode);

UserRouter.post("/store", StoreToDb);

UserRouter.get("/search", SearchDb);




//Payment
UserRouter.post("/add_card", verifyJwtToken, AddCard);
UserRouter.get("/get_transactions", verifyJwtToken, GetTransactions);
UserRouter.get("/list_cards", verifyJwtToken, GetUserPaymentSources);
UserRouter.post("/subscribe", verifyJwtToken, subscribeUser);
UserRouter.post("/cancel_subscription", verifyJwtToken, CancelSubscription);

UserRouter.post("/create_webhook", CreateWebHook);
UserRouter.post("/subscription_updated", SubscriptionUpdated);


//Oauth
UserRouter.post("/login_instagram", verifyJwtToken, AddInstagramAuth);
UserRouter.post("/login_google", verifyJwtToken, AddGoogleAuth);


//Creator Profile
UserRouter.get("/creator_dashboard", verifyJwtToken, CreatorDashboard);

export default UserRouter
