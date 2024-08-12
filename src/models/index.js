import dbConfig from "../config/db.config.js";
import CallModel from "./call.model.js";
import User from "./user.model.js";
import Assistant from "./assistants.model.js";


import Sequelize from 'sequelize'

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
db.Sequelize = Sequelize;
db.sequelize = sequelize;
 

db.User = User(sequelize, Sequelize);
db.CallModel = CallModel(sequelize, Sequelize);
db.Assistant = Assistant(sequelize, Sequelize);






export default db;