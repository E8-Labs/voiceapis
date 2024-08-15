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
// import TeamResource from "../resources/teamresource.js";
// import UserSubscriptionResource from "../resources/UserSubscriptionResource.js";
import * as stripe from '../services/stripe.js'

const User = db.User;
const Op = db.Sequelize.Op;

export const AddCard = async (req, res) => {
    console.log("Add card api")
    JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
        if (authData) {
            let user = await db.User.findByPk(authData.user.id);
            let token = req.body.source;
            console.log("User provided Token is ", token)
            let card = await stripe.createCard(user, token);

            res.send({ status: card !== null, message: card !== null ? "Card added" : "Card not added", data: card })
        }
    })
}


export const GetUserPaymentSources = async (req, res) => {
    JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
        if (authData) {
            let user = await db.User.findByPk(authData.user.id);
            let cards = await stripe.loadCards(user);
            //console.log("cards loaded ", cards)
            res.send({ status: true, message: "Card loaded", data: cards })
        }
    })
}



export const GetTransactions = async (req, res) => {
    JWT.verify(req.token, process.env.SecretJwtKey, async(error, authData) => {
        if(error){
            res.send({ status: false, message: "Unauthenticated user", data: null })
        }
        else{
            let user = await db.User.findByPk(authData.user.id)
            let customerId = user.customerId || null
            if(customerId){

                let transactions = await db.TransactionModel.findAll({
                    where: {
                        customerId: customerId
                    }
                })
                return res.send({status: true, message: "Transactions obtained", data: transactions})
            }
            else{
                res.send({ status: true, message: "User don't have transactions", data: null })
            }
            
        }
    })
}

export const DownloadInvoice = async(req, res) => {
    let invoiceId = req.body.invoiceId
    JWT.verify(req.token, process.env.SecretJwtKey, async(error, authData)=> {
        if(error){
            res.send({ status: false, message: "Unauthenticated user", data: null })
        }
        else{
            let userId = authData.user.id;
            
            let t = await db.TransactionModel.findOne({
                where: {
                    invoiceId: invoiceId
                }
            })
            if(t && (t.invoiceUrl != null && t.invoiceUrl != '')){
                res.send({ status: true, message: "Invoice already generated", data: {url: t.invoiceUrl} })
            }
            else{
                let url = await stripe.createInvoicePdf(invoiceId)
                const [updated] = await db.TransactionModel.update(
                    { invoiceUrl: url },
                    { where: { invoiceId } }
                );
                res.send({ status: true, message: "Invoice generated", data: {url: url} })
            }
            
    
            
        }
    })
}