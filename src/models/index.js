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


import Sequelize from 'sequelize'
import SocialAuthModel from "./socialauth.model.js";
import GoogleAuthModel from "./googleauth.model.js";
import SubscriptionModel from "./subscription.model.js";

const sequelize = new Sequelize(dbConfig.MYSQL_DB, dbConfig.MYSQL_DB_USER, dbConfig.MYSQL_DB_PASSWORD, {
  host: dbConfig.MYSQL_DB_HOST,
  port: dbConfig.MYSQL_DB_PORT,
  dialect: dbConfig.dialect,
  logging: false
});

try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}



const db = {};
let models = {}
db.Sequelize = Sequelize;
db.sequelize = sequelize;
 

db.User = User(sequelize, Sequelize);
models["User"] = db.User

db.CallModel = CallModel(sequelize, Sequelize);
models["CallModel"] = db.CallModel

db.Assistant = Assistant(sequelize, Sequelize);
models["Assistant"] = db.Assistant

db.PhoneVerificationCodeModel = PhoneVerificationCodeModel(sequelize, Sequelize);
models["PhoneVerificationCodeModel"] = db.PhoneVerificationCodeModel

db.UserAi = UserAi(sequelize, Sequelize);
models["UserAi"] = db.UserAi

db.SellingProducts = SellingProducts(sequelize, Sequelize);
models["SellingProducts"] = db.SellingProducts

db.KycQuestions = KycQuestions(sequelize, Sequelize);
models["KycQuestions"] = db.KycQuestions

db.EmailVerificationCode = EmailVerificationCode(sequelize, Sequelize);
models["EmailVerificationCode"] = db.EmailVerificationCode

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

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});


export default db;