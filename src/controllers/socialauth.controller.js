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

export const AddInstagramAuth = async (req, res) => {
    console.log("Add instagram login api", req.body)
    JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
        if (authData) {
            let user = await db.User.findByPk(authData.user.id);
            try {
                const response = await axios.post(
                  `https://api.instagram.com/oauth/access_token`,
                  {
                    client_id: req.body.clientId,
                    client_secret: req.body.clientSecret,
                    grant_type: 'authorization_code',
                    redirect_uri: req.body.redirectUri,
                    code: req.body.code,
                  }
                );
                const { access_token } = response.data;
                console.log("Auth instagram data is ", response.data);
      
                const userResponse = await axios.get(
                  `https://graph.instagram.com/me?fields=id,username&access_token=${access_token}`
                );

                let d = await db.SocialAuthModel.create({
                    accessToken: access_token,
                    name: userResponse.data.username,
                    socialUserId: userResponse.data.id,
                    userId: user.id,
                })

                res.send({ status: true, message: "Auth success", data: d })
                // setUserInfo(userResponse.data);
              } catch (error) {
                console.error('Error exchanging code for access token:', error.response ? error.response.data : error.message);
                res.send({ status: false, message: `Error exchanging code for access token: ${error.response} ? ${error.response.data} : ${error.message}`, data: d })
              }
            
        }
    })
}