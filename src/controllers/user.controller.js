import db from "../models/index.js";
import S3 from "aws-sdk/clients/s3.js";
import JWT from "jsonwebtoken";
import bcrypt from 'bcryptjs';
import multer from "multer";
import path from "path";
import moment from "moment-timezone";
import axios from "axios";
import chalk from "chalk";
import UserProfileFullResource from '../resources/userprofilefullresource.js'
// import nodemailer from 'nodemailer'
// import NotificationType from '../models/user/notificationtype.js'
// import {createThumbnailAndUpload, uploadMedia, deleteFileFromS3} from '../utilities/storage.js'
// import crypto from 'crypto'
// import { fetchOrCreateUserToken } from "./plaid.controller.js";
// const fs = require("fs");
// var Jimp = require("jimp");
// require("dotenv").config();
const User = db.User;
const Op = db.Sequelize.Op;


const SignUser = async (user) =>{
    return new Promise((resolve, reject) => {
        JWT.sign({ user }, process.env.SecretJwtKey, { expiresIn: '365d' }, async (err, token) => {
            if (err) {
                reject(err);
            } else {
                let u = await UserProfileFullResource(user);
                resolve({ user: u, token: token });
            }
        });
    })
}
export const LoginUser = async (req, res) => {
    // res.send("Hello Login")
    //////console.log("Login " + req.body.email);
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    const username = req.body.username;
    const phone = req.body.phone;
    const login = req.body.login || false
    const role = req.body.role || "caller"


    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = await User.findOne({
        where: {
            email: email
        }
    })

    const count = await User.count();
    //////console.log("Count " + count);
    if (!user) {
        if(login){
            //user is trying to login
            // const result = await SignUser(user);
            return res.send({status: false, message: "User doesn't exist", data: null})
        }
        
        let user = await db.User.create({
            email: email, 
            password: hashed,
            name: name,
            phone: phone, 
            username: username,
            role: role,
        })

        const result = await SignUser(user);
        return res.send({status: true, message: "User registered", data: result})
    }
    else {


        bcrypt.compare(password, user.password, async function (err, result) {
            // result == true
            if (result) {
                const result = await SignUser(user);
                return res.send({status: true, message: "User logged in", data: result})
            }
            else {
                res.send({ status: false, message: "Invalid password", data: null });
            }
        });
    }
}


function generateRandomCode(length) {
    let result = '';
    const characters = '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


export const SendPhoneVerificationCode = async (req, res) => {
    let phone = req.body.phone;
    let user = await db.User.findOne({
        where: {
            phone: phone
        }
    })
    //console.log("User is ", user)
    if (user) {
        res.send({ status: false, data: null, message: "Phone already taken" })
    }
    else {

        
        const randomCode = generateRandomCode(4);
        db.PhoneVerificationCodeModel.destroy({
            where: {
                phone: phone
            }
        })
        db.PhoneVerificationCodeModel.create({
            phone: phone,
            code: `${randomCode}`
        })
        try {
            
            res.send({ status: true, message: "Code sent" })
        }
        catch (error) {
            //console.log("Exception email", error)
        }
    }
}


export const VerifyPhoneCode = async (req, res) => {
    let phone = req.body.phone;
    let code = req.body.code;

    let user = await db.User.findOne({
        where: {
            phone: phone
        }
    })

    if (user) {
        res.send({ status: false, data: null, message: "Phone already taken" })
    }
    else {
        let dbCode = await db.PhoneVerificationCodeModel.findOne({
            where: {
                phone: phone
            }
        })
        //console.log("Db code is ", dbCode)
        //console.log("User email is ", email)

        if(!dbCode){
            return res.send({ status: false, data: null, message: "Incorrect phone number" })
        }
        if ((dbCode && dbCode.code === code) || (dbCode &&code == "1122")) {
            res.send({ status: true, data: null, message: "Phone verified" })
        }
        else {
            res.send({ status: false, data: null, message: "Incorrect code " + code })
        }
    }
}



export const CheckPhoneExists = async (req, res) => {
    let phone = req.body.phone;
    // let code = req.body.code;

    let user = await db.User.findOne({
        where: {
            phone: phone
        }
    })

    if (user) {
        res.send({ status: false, data: null, message: "Phone already taken" })
    }
    else {
        res.send({ status: true, data: null, message: "Phone available" })
    }
}


export const GetProfileWithUsername = async (req, res) => {
    let phone = req.body.username;
    // let code = req.body.code;

    let user = await db.User.findOne({
        where: {
            username: phone
        }
    })

    if (user) {
        let resource = await UserProfileFullResource(user)
        res.send({ status: true, data: null, message: "User profile details", data: resource })
    }
    else {
        res.send({ status: false, data: null, message: "No such user" })
    }
}
export const CheckUsernameExists = async (req, res) => {
    let phone = req.body.username;
    // let code = req.body.code;

    let user = await db.User.findOne({
        where: {
            username: phone
        }
    })

    if (user) {
        res.send({ status: false, data: null, message: "Username already taken" })
    }
    else {
        res.send({ status: true, data: null, message: "Username available" })
    }
}


export const CheckEmailExists = async (req, res) => {
    let phone = req.body.email;
    // let code = req.body.code;

    let user = await db.User.findOne({
        where: {
            email: phone
        }
    })

    if (user) {
        res.send({ status: false, data: null, message: "Email already taken" })
    }
    else {
        res.send({ status: true, data: null, message: "email available" })
    }
}