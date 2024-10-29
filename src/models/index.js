import dbConfig from "../config/db.config.js";
import CallModel from "./call.model.js";
import User from "./user.model.js";
import Assistant from "./assistants.model.js";
import PhoneVerificationCodeModel from "./phoneVerificationCode.model.js";
import UserAi from "./ai/userai.model.js";
import SellingProducts from "./ai/sellingproducts.model.js";
import KycQuestions from "./ai/kycquestions.model.js";
import EmailVerificationCode from "./emailverificationcode.model.js";
import KnowledgeBase from "./ai/knowledgebase.model.js";
import YouTubeVideo from "./videos.model.js";
import PurchasedProduct from "./ai/purchasedproducts.model.js";
import UserCallSummary from "./usercallsummary.model.js";

import AIProfile from "./ai/aiprofile.model.js";

import ChatModel from "./chat.model.js";

import Sequelize from "sequelize";
import SocialAuthModel from "./socialauth.model.js";
import GoogleAuthModel from "./googleauth.model.js";
import SubscriptionModel from "./subscription.model.js";
import PersonalityTrait from "./ai/personalitytrait.model.js";
import FrameworkAndTechnique from "./ai/frameworks.model.js";
import UserValues from "./ai/values.model.js";
import UserBeliefs from "./ai/beliefs.model.js";
import IntractionExample from "./ai/intraction.model.js";
import UserPhilosophyAndViews from "./ai/philosophyviews.model.js";
import PhrasesAndQuotes from "./ai/phrasesandquotes.model.js";
import DonotDiscuss from "./ai/donotdiscuss.model.js";
import CommunicationInstructions from "./ai/communicationinstructions.model.js";
import MainPoints from "./ai/mainpoints.model.js";
import ObjectionHandling from "./ai/objectionhandling.model.js";
import CallStrategy from "./ai/CallStrategy.model.js";
import UserDemeanor from "./ai/UserDemeanor.model.js";
import InterpersonalSkills from "./ai/InterPersonalSkills.model.js";
import ProductFaqs from "./ai/ProductFaqs.model.js";
import CommunicationCommonFaqs from "./ai/CommunicationCommonFaqs.model.js";
import GptCostModel from "./gptcost.model.js";
import CommunicationStyle from "./ai/communicationstyle.model.js";

const sequelize = new Sequelize(
  dbConfig.MYSQL_DB,
  dbConfig.MYSQL_DB_USER,
  dbConfig.MYSQL_DB_PASSWORD,
  {
    host: dbConfig.MYSQL_DB_HOST,
    port: dbConfig.MYSQL_DB_PORT,
    dialect: dbConfig.dialect,
    logging: false,
  }
);

try {
  await sequelize.authenticate();
  //console.log('Connection has been established successfully.');
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

const db = {};
let models = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.ChatModel = ChatModel(sequelize, Sequelize);
models["ChatModel"] = db.ChatModel;

db.User = User(sequelize, Sequelize);
models["User"] = db.User;

db.CallModel = CallModel(sequelize, Sequelize);
models["CallModel"] = db.CallModel;

db.User.hasMany(db.CallModel, { foreignKey: "userId" }); // One user (caller) can have many calls
db.CallModel.belongsTo(db.User, { foreignKey: "userId", as: "caller" }); // A call belongs to a user (caller)

db.Assistant = Assistant(sequelize, Sequelize);
models["Assistant"] = db.Assistant;
db.User.hasMany(db.Assistant, { foreignKey: "userId" });
db.Assistant.belongsTo(db.User, { foreignKey: "userId" });

db.PhoneVerificationCodeModel = PhoneVerificationCodeModel(
  sequelize,
  Sequelize
);
models["PhoneVerificationCodeModel"] = db.PhoneVerificationCodeModel;

db.UserAi = UserAi(sequelize, Sequelize);
models["UserAi"] = db.UserAi;

db.User.hasMany(db.UserAi, { foreignKey: "userId" });
db.UserAi.belongsTo(db.User, { foreignKey: "userId" });

db.SellingProducts = SellingProducts(sequelize, Sequelize);
models["SellingProducts"] = db.SellingProducts;

db.KycQuestions = KycQuestions(sequelize, Sequelize);
models["KycQuestions"] = db.KycQuestions;

db.EmailVerificationCode = EmailVerificationCode(sequelize, Sequelize);
models["EmailVerificationCode"] = db.EmailVerificationCode;

db.KnowledgeBase = KnowledgeBase(sequelize, Sequelize);
models["KnowledgeBase"] = db.KnowledgeBase;

db.SocialAuthModel = SocialAuthModel(sequelize, Sequelize);
models["SocialAuthModel"] = db.SocialAuthModel;

db.GoogleAuthModel = GoogleAuthModel(sequelize, Sequelize);
models["GoogleAuthModel"] = db.GoogleAuthModel;

db.YouTubeVideo = YouTubeVideo(sequelize, Sequelize);
models["YouTubeVideo"] = db.YouTubeVideo;

db.SubscriptionModel = SubscriptionModel(sequelize, Sequelize);
models["SubscriptionModel"] = db.SubscriptionModel;

db.PurchasedProduct = PurchasedProduct(sequelize, Sequelize);
models["PurchasedProduct"] = db.PurchasedProduct;

db.UserCallSummary = UserCallSummary(sequelize, Sequelize);
models["UserCallSummary"] = db.UserCallSummary;

db.AIProfile = AIProfile(sequelize, Sequelize);
models["AIProfile"] = db.AIProfile;

db.PersonalityTrait = PersonalityTrait(sequelize, Sequelize);
models["PersonalityTrait"] = db.PersonalityTrait;

db.FrameworkAndTechnique = FrameworkAndTechnique(sequelize, Sequelize);
models["FrameworkAndTechnique"] = db.FrameworkAndTechnique;

db.UserValues = UserValues(sequelize, Sequelize);
models["UserValues"] = db.UserValues;

db.UserBeliefs = UserBeliefs(sequelize, Sequelize);
models["UserBeliefs"] = db.UserBeliefs;

db.IntractionExample = IntractionExample(sequelize, Sequelize);
models["IntractionExample"] = db.IntractionExample;

db.UserPhilosophyAndViews = UserPhilosophyAndViews(sequelize, Sequelize);
models["UserPhilosophyAndViews"] = db.UserPhilosophyAndViews;

db.PhrasesAndQuotes = PhrasesAndQuotes(sequelize, Sequelize);
models["PhrasesAndQuotes"] = db.PhrasesAndQuotes;

db.CommunicationInstructions = CommunicationInstructions(sequelize, Sequelize);
models["CommunicationInstructions"] = db.CommunicationInstructions;

db.DonotDiscuss = DonotDiscuss(sequelize, Sequelize);
models["DonotDiscuss"] = db.DonotDiscuss;

db.ObjectionHandling = ObjectionHandling(sequelize, Sequelize);
models["ObjectionHandling"] = db.ObjectionHandling;

db.MainPoints = MainPoints(sequelize, Sequelize);
models["MainPoints"] = db.MainPoints;

db.CallStrategy = CallStrategy(sequelize, Sequelize);
models["CallStrategy"] = db.CallStrategy;

db.UserDemeanor = UserDemeanor(sequelize, Sequelize);
models["UserDemeanor"] = db.UserDemeanor;

db.InterpersonalSkills = InterpersonalSkills(sequelize, Sequelize);
models["InterpersonalSkills"] = db.InterpersonalSkills;

db.ProductFaqs = ProductFaqs(sequelize, Sequelize);
models["ProductFaqs"] = db.ProductFaqs;

db.CommunicationStyle = CommunicationStyle(sequelize, Sequelize);
models["CommunicationStyle"] = db.CommunicationStyle;

db.CommunicationCommonFaqs = CommunicationCommonFaqs(sequelize, Sequelize);
models["CommunicationCommonFaqs"] = db.CommunicationCommonFaqs;

db.GptCost = GptCostModel(sequelize, Sequelize);
models["GptCost"] = db.GptCost;

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

export default db;
