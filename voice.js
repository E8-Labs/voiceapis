import "module-alias/register.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodeCron from "node-cron";

import db from "./src/models/index.js";

import callRouter from "./src/routes/call.route.js";
import UserRouter from "./src/routes/user.route.js";
import AiRouter from "./src/routes/ai.route.js";
import actionRouter from "./src/routes/action.route.js"; //"./src/routes/action.route.js"

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  //console.log(`${req.method} request for '${req.url}'`);
  next();
});

//http://localhost:3000
app.use(
  cors({
    origin: process.env.AppHost, //https://voiceai-ruby.vercel.app
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", process.env.AppHost);
  res.header("Access-Control-Allow-Methods", "GET, POST");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// https://voiceai-ruby.vercel.app
// app.use(cors({
//   origin: 'https://app.mycreatorx.com',//
//   methods: ['GET', 'POST'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// }));

// app.options('*', (req, res) => {
//   res.header('Access-Control-Allow-Origin', 'https://app.mycreatorx.com');
//   res.header('Access-Control-Allow-Methods', 'GET, POST');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   res.header('Access-Control-Allow-Credentials', 'true');
//   res.sendStatus(200);
// });

db.sequelize.sync({ alter: true });

app.use("/api/calls", callRouter);
app.use("/api/user", UserRouter);
app.use("/api/ai", AiRouter);
app.use("/api/action", actionRouter);

const server = app.listen(process.env.Port, () => {
  //console.log("Started listening on " + process.env.Port);
});
