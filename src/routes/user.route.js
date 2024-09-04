import express from 'express'
import multer from 'multer';

import {verifyJwtToken} from '../middleware/jwtmiddleware.js'
import { LoginUser, SendPhoneVerificationCode, VerifyPhoneCode, CheckPhoneExists, UpdateUserToCreator,
    CheckUsernameExists, CheckEmailExists, GetProfileWithUsername, SendEmailVerificationCode, VerifyEmailCode,
    UpdateProfile
 } from '../controllers/user.controller.js'

import { StoreToDb, SearchDb } from '../controllers/knowledge.controller.js';
import { AddCard, GetUserPaymentSources, DownloadInvoice, GetTransactions, 
    subscribeUser, CancelSubscription, DeleteCard, BuyProduct, MakeDefaultPaymentMethod } from '../controllers/paymentController.js';

import { AddInstagramAuth, AddGoogleAuth, ScrapeTweets } from '../controllers/socialauth.controller.js';

import { CreateWebHook, SubscriptionUpdated } from "../services/stripe.js";
import { CreatorDashboard, AssistantCalls, MyAi } from '../controllers/profile.controller.js';
import { GetCallLogs, ListCustomerInvoices, GetCreatorsAndTopProducts } from '../controllers/callerprofile.controller.js';


const uploadFiles = multer().fields([
    { name: 'media', maxCount: 1 }
  ]);

let UserRouter = express.Router()


UserRouter.post("/login", LoginUser);
UserRouter.post("/updateUserRole", verifyJwtToken, uploadFiles, UpdateUserToCreator);
UserRouter.post("/updateProfile", verifyJwtToken, uploadFiles, UpdateProfile);
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
UserRouter.post("/add_card", verifyJwtToken, uploadFiles, AddCard);
UserRouter.post("/make_default", verifyJwtToken, uploadFiles, MakeDefaultPaymentMethod);
UserRouter.post("/buy_product", verifyJwtToken, uploadFiles, BuyProduct);
UserRouter.post("/delete_card", verifyJwtToken, uploadFiles, DeleteCard);
UserRouter.get("/get_transactions", verifyJwtToken, uploadFiles, GetTransactions);
UserRouter.get("/list_cards", verifyJwtToken, uploadFiles, GetUserPaymentSources);
UserRouter.post("/subscribe", verifyJwtToken, uploadFiles, subscribeUser);
UserRouter.post("/cancel_subscription", verifyJwtToken, uploadFiles, CancelSubscription);

UserRouter.post("/create_webhook", CreateWebHook);
UserRouter.post("/subscription_updated", SubscriptionUpdated);


//Oauth
UserRouter.post("/login_instagram", verifyJwtToken, uploadFiles, AddInstagramAuth);
UserRouter.post("/login_google", verifyJwtToken, uploadFiles, AddGoogleAuth);
UserRouter.post("/scrap_tweets", verifyJwtToken, uploadFiles, ScrapeTweets);


//Creator Profile
UserRouter.get("/creator_dashboard", verifyJwtToken, uploadFiles, CreatorDashboard);
UserRouter.get("/creator_calls", verifyJwtToken, uploadFiles, AssistantCalls);
UserRouter.get("/my_ai", verifyJwtToken, uploadFiles, MyAi);



//Caller Profile
UserRouter.get("/call_logs", verifyJwtToken, uploadFiles, GetCallLogs);
UserRouter.get("/invoices", verifyJwtToken, uploadFiles, ListCustomerInvoices);
UserRouter.get("/caller_dashboard", verifyJwtToken, uploadFiles, GetCreatorsAndTopProducts);
export default UserRouter
