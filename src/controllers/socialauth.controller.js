import db from "../models/index.js";
import JWT from "jsonwebtoken";
import qs  from 'qs';
import axios from "axios";

const User = db.User;
const Op = db.Sequelize.Op;


export const AddInstagramAuth = async (req, res) => {
    console.log("Add instagram login api", process.env.InstaClientId);
    
    JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
        if (authData) {
            let user = await db.User.findByPk(authData.user.id);
            try {
                // Step 1: Exchange authorization code for short-lived access token
                const response = await axios.post(
                    `https://api.instagram.com/oauth/access_token`,
                    qs.stringify({
                        client_id: process.env.InstaClientId,
                        client_secret: process.env.InstaClientSecret,
                        grant_type: 'authorization_code',
                        redirect_uri: process.env.InstaRedirectUri,
                        code: req.body.code,
                    }),
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    }
                );

                const { access_token: shortLivedAccessToken } = response.data;
                console.log("Short-lived access token:", shortLivedAccessToken);

                // Step 2: Exchange short-lived access token for long-lived access token
                const longLivedTokenResponse = await axios.get(
                    `https://graph.instagram.com/access_token`,
                    {
                        params: {
                            grant_type: 'ig_exchange_token',
                            client_secret: process.env.InstaClientSecret,
                            access_token: shortLivedAccessToken,
                        },
                    }
                );

                const { access_token: longLivedAccessToken, expires_in } = longLivedTokenResponse.data;
                console.log("Long-lived access token:", longLivedAccessToken);
                console.log("Expires in:", expires_in, "seconds");

                // Step 3: Fetch user data using the long-lived access token
                const userResponse = await axios.get(
                    `https://graph.instagram.com/me?fields=id,username&access_token=${longLivedAccessToken}`
                );

                // Step 4: Store the long-lived access token in the database
                let instaUser = await db.SocialAuthModel.findOne({
                    where:{
                        userId: user.id
                    }
                })
                if(instaUser){
                    instaUser.accessToken = longLivedAccessToken;
                    instaUser.name = userResponse.data.username;
                    let saved = await instaUser.save();
                }
                else{
                    instaUser = await db.SocialAuthModel.create({
                        accessToken: longLivedAccessToken,
                        name: userResponse.data.username,
                        socialUserId: userResponse.data.id,
                        userId: user.id,
                    });
                }

                res.send({ status: true, message: "Auth success", data: instaUser });
            } catch (error) {
                console.error('Error exchanging code for access token:', error.response ? error.response.data : error.message);
                res.send({
                    status: false,
                    message: `Error exchanging code for access token: ${error.response ? error.response.data : error.message}`,
                    data: null
                });
            }
        } else {
            res.send({ status: false, message: "Unauthenticated User" });
        }
    });
};
