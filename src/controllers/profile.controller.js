import db from "../models/index.js";
import S3 from "aws-sdk/clients/s3.js";
import JWT from "jsonwebtoken";
import bcrypt from 'bcryptjs';
import multer from "multer";
import path from "path";
import moment from "moment-timezone";
import axios from "axios";
import chalk from "chalk";
import nodemailer from 'nodemailer'
import UserProfileFullResource from '../resources/userprofilefullresource.js'
import CallLiteResource from "../resources/callliteresource.js";
import { start } from "repl";

const User = db.User;
const Op = db.Sequelize.Op;



export const CreatorDashboard = async(req, res)=>{
    JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
        if (authData) {
            let userId = authData.user.id;
            let data = await getUserCallStats(userId)
            res.send({ status: true, data: data, message: "Dashboard" })
        }
        else{
            res.send({ status: false, data: null, message: "Unauthenticated user" })
        }
    })
}

async function getUserCallStats(userId) {
    const now = new Date();
  
    const intervals = {
      '24_hours': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7_days': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30_days': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    };
  
    const results = {};
  
    for (const [key, startDate] of Object.entries(intervals)) {
      const calls = await db.CallModel.findAll({
        where: {
          modelId: userId,
          status: 'completed',
          createdAt: {
            [db.Sequelize.Op.between]: [startDate, now],
          },
        },
      });
  
      const totalCalls = calls.length;
    console.log(`Calls between ${startDate} - ${now}`, totalCalls)
      let totalDurationSeconds = 0;
      let totalEarnings = 0;
  
      calls.forEach(call => {
        console.log("Adding duration ", call.duration)
        totalDurationSeconds += Number(call.duration);
        console.log('TotalDurationAfterAdded', totalDurationSeconds)
        // const durationMinutes = Math.floor(call.duration / 60);
        
      });
      const totalDurationMinutes = Math.floor(totalDurationSeconds / 60);
      console.log('DurationInMinutes', totalDurationMinutes)
      if (totalDurationMinutes > 5) {
        totalEarnings += (totalDurationMinutes - 5) * 10; // Only charge after the first 5 minutes
      }
      
   // Subtract first 5 minutes, then multiply by $1/minute
  
      // Top 10 callers
      const topCallers = {};
  
      for (const call of calls) {
        const callerId = call.userId;
        console.log("CallFrom", call.userId)
        console.log("CallId", call.id)
        console.log("CallTo", call.modelId)
        if (!topCallers[callerId]) {
          const user = await db.User.findOne({
            where: {
              id: call.userId,
            },
            // attributes: ['name'], // Fetch only the name to optimize query
          });
          let profile = await UserProfileFullResource(user)
  
          topCallers[callerId] = {
            user: profile,
            name: user ? user.name : "Unknown",
            callId: call.id,
            totalMinutes: 0,
            totalSpent: 0,
            callCount: 0,
          };
        }
        
        const durationMinutes = Math.floor(call.duration / 60);
        topCallers[callerId].totalMinutes += durationMinutes;
        topCallers[callerId].totalSpent += Math.max(0, durationMinutes - 5) * 10;
        topCallers[callerId].callCount += 1;
      }
    //   console.log("Top callers", topCallers)
      const topTenCallers = Object.values(topCallers)
        .sort((a, b) => b.callCount - a.callCount)
        .slice(0, 10);
  
      results[key] = {
        totalCalls,
        totalDurationMinutes,
        totalEarnings,
        topTenCallers,
      };
    }
  
    return results;
  }
  

  


  export const MyAi = async(req, res)=>{
    JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
        if (authData) {
            let userId = authData.user.id;
            let ai = await db.UserAi.findOne({
                where:{
                    userId: userId
                }
            })
            let kb = await db.KnowledgeBase.findAll({
                where:{
                    userId: userId
                }
            })

            let products = await db.SellingProducts.findAll({
                where:{
                    userId: userId
                }
            })

            let questions = await db.KycQuestions.findAll({
                where:{
                    userId: userId
                }
            })
            res.send({ status: true, data: {ai, kb, products, questions}, message: "My AI" })
        }
        else{
            res.send({ status: false, data: null, message: "Unauthenticated user" })
        }
    })
}


export const AssistantCalls = async(req, res)=>{
    let offset = req.body.offset || 0;
    let limit = 20;
    JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
        if (authData) {
            let userId = authData.user.id;
            let calls = await getPaginatedCalls(userId, offset, limit)
            
            res.send({ status: true, data: calls, message: "My AI" })
        }
        else{
            res.send({ status: false, data: null, message: "Unauthenticated user" })
        }
    })
}


async function getPaginatedCalls(userId, offset, limit = 10) {
    // Fetch paginated calls
    const calls = await db.CallModel.findAll({
        where: {
            modelId: userId,
            status: "completed"
        },
      offset: offset,
      limit: limit,
    });
  
    // Calculate totalCalls, totalMinutes, and revenue
    const allCalls = await db.CallModel.findAll({
        where: {
            modelId: userId
        }
    });
  
    const totalCalls = allCalls.length;
  
    const totalDurationSeconds = allCalls.reduce((sum, call) => sum + Number(call.duration), 0);
    const totalMinutes = Math.floor(totalDurationSeconds / 60);
  
    const revenue = allCalls.reduce((sum, call) => {
      const durationMinutes = Math.floor(Number(call.duration) / 60);
      return sum + Math.max(0, durationMinutes) * 10;
    }, 0);
  
    return {
      calls: await CallLiteResource(calls),
      totalCalls,
      totalMinutes,
      revenue,
    };
  }