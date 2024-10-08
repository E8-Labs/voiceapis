import db from "../models/index.js";
import S3 from "aws-sdk/clients/s3.js";
import JWT from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import moment from "moment-timezone";
import axios from "axios";
import chalk from "chalk";
import nodemailer from "nodemailer";
import UserProfileFullResource from "../resources/userprofilefullresource.js";
import CallLiteResource from "../resources/callliteresource.js";
import { start } from "repl";

const User = db.User;
const Op = db.Sequelize.Op;

export const CreatorDashboard = async (req, res) => {
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      //Get User Products
      let products = await db.SellingProducts.findAll({
        where: {
          userId: userId,
        },
      });
      let data = await getUserCallStats(userId);
      res.send({
        status: true,
        data: { ...data, products },
        message: "Dashboard",
      });
    } else {
      res.send({ status: false, data: null, message: "Unauthenticated user" });
    }
  });
};

async function getUserCallStats(userId) {
  const now = new Date();

  const intervals = {
    "24_hours": new Date(now.getTime() - 24 * 60 * 60 * 1000),
    "7_days": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    "30_days": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  };

  const results = {};

  //Calculate unique total callers

  for (const [key, startDate] of Object.entries(intervals)) {
    const uniqueCallers = await db.CallModel.count({
      distinct: "userId",
      where: {
        modelId: userId,
        status: "completed",
        createdAt: {
          [db.Sequelize.Op.between]: [startDate, now],
        },
      },
    });

    const calls = await db.CallModel.findAll({
      where: {
        modelId: userId,
        status: "completed",
        createdAt: {
          [db.Sequelize.Op.between]: [startDate, now],
        },
      },
    });

    let amountToChargePerMin = 10; // Dollars
    let ai = await db.UserAi.findOne({
      where: {
        userId: userId,
      },
    });
    if (ai) {
      //console.log("An AI Found for user ", ai);
      amountToChargePerMin = ai.price;
    } else {
      amountToChargePerMin = 10; // by default 10
    }

    const totalCalls = calls.length;
    //console.log(`Calls between ${startDate} - ${now}`, totalCalls);
    let totalDurationSeconds = 0;
    let totalEarnings = 0;

    calls.forEach((call) => {
      //console.log("Adding duration ", call.duration);
      totalDurationSeconds += Number(call.duration);
      //console.log("TotalDurationAfterAdded", totalDurationSeconds);
      // const durationMinutes = Math.floor(call.duration / 60);
    });
    const totalDurationMinutes = Math.floor(totalDurationSeconds / 60);
    //console.log("DurationInMinutes", totalDurationMinutes);
    if (totalDurationMinutes > 5) {
      totalEarnings += (totalDurationMinutes - 5) * amountToChargePerMin; // Only charge after the first 5 minutes
    }

    // Subtract first 5 minutes, then multiply by $1/minute

    // Top 10 callers
    const topCallers = {};

    for (const call of calls) {
      const callerId = call.userId;
      //console.log("CallFrom", call.userId);
      //console.log("CallId", call.id);
      //console.log("CallTo", call.modelId);
      if (!topCallers[callerId]) {
        const user = await db.User.findOne({
          where: {
            id: call.userId,
          },
          // attributes: ['name'], // Fetch only the name to optimize query
        });
        let profile = await UserProfileFullResource(user);

        topCallers[callerId] = {
          user: profile,
          name: user ? user.name : "Unknown",
          callId: call.id,
          totalMinutes: "00:00",
          callTimeMinutes: 0,
          callTimeSeconds: 0,
          totalSpent: 0,
          callCount: 0,
        };
      }

      // let totalEarned = 0; // if the creator has free calls

      const durationMinutes = Math.floor(Number(call.duration) / 60);

      topCallers[callerId].callTimeMinutes += durationMinutes;
      topCallers[callerId].callTimeSeconds += Number(call.duration);
      //console.log(`Duration in minuites for ${callerId}`, durationMinutes);
      let min = Math.floor(topCallers[callerId].callTimeSeconds / 60) || 0;
      if (min < 1) {
        min = 0;
      }
      let secs = topCallers[callerId].callTimeSeconds % 60 || 0;
      topCallers[callerId].totalMinutes = `${min < 10 ? `0${min}` : min}:${
        secs < 10 ? `0${secs}` : secs
      }`;
      topCallers[callerId].totalSpent +=
        (Math.max(0, call.duration) * amountToChargePerMin) / 60;
      topCallers[callerId].callCount += 1;
    }
    //   //console.log("Top callers", topCallers)
    const topTenCallers = Object.values(topCallers)
      .sort((a, b) => b.callCount - a.callCount)
      .slice(0, 10);

    results[key] = {
      totalCalls,
      totalDurationMinutes,
      totalEarnings,
      topTenCallers,
      uniqueCallers,
      // products
    };
  }

  return results;
}

export const AssistantCalls = async (req, res) => {
  let offset = req.query.offset || 0;
  let search = req.query.search || "";
  let limit = 20;
  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let userId = authData.user.id;
      let calls = await getPaginatedCalls(userId, offset, limit, search);

      res.send({ status: true, data: calls, message: "My AI" });
    } else {
      res.send({ status: false, data: null, message: "Unauthenticated user" });
    }
  });
};

async function getPaginatedCalls(userId, offset, limit = 10, search = "") {
  // Define the search condition
  const searchCondition = search
    ? {
        [db.Sequelize.Op.or]: [
          { "$caller.name$": { [db.Sequelize.Op.like]: `%${search}%` } },
          { "$caller.username$": { [db.Sequelize.Op.like]: `%${search}%` } },
        ],
      }
    : {};

  // Fetch paginated calls with search condition
  let calls = await db.CallModel.findAll({
    where: {
      modelId: userId,
      status: {
        [db.Sequelize.Op.in]: ["completed", "hangup_on_voicemail"],
      },
      ...searchCondition,
    },
    include: [
      {
        model: db.User,
        as: "caller", // Use the correct alias as defined in your association
        attributes: ["name", "username"], // Fetch only required fields
      },
    ],
    offset: offset,
    limit: limit,
  });

  // Calculate totalCalls, totalMinutes, and revenue
  const allCalls = await db.CallModel.findAll({
    where: {
      modelId: userId,
      status: {
        [db.Sequelize.Op.in]: ["completed", "hangup_on_voicemail"],
      },
    },
    include: [
      {
        model: db.User,
        as: "caller", // Use the correct alias as defined in your association
      },
    ],
  });

  const totalCalls = allCalls.length;

  const totalDurationSeconds = allCalls.reduce(
    (sum, call) => sum + Number(call.duration),
    0
  );
  const totalMinutes = Math.floor(totalDurationSeconds / 60);

  const creatorAiData = await db.UserAi.findOne({
    where: { userId: userId },
  });
  const ratePerMinute = creatorAiData ? creatorAiData.price : 0;
  const revenue = allCalls.reduce((sum, call) => {
    const durationMinutes = Math.floor(Number(call.duration) / 60);
    return sum + Math.max(0, durationMinutes) * ratePerMinute;
  }, 0);

  return {
    calls: await CallLiteResource(calls),
    totalCalls,
    totalMinutes,
    revenue,
  };
}
