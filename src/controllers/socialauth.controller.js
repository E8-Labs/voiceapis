import db from "../models/index.js";
import JWT from "jsonwebtoken";
import qs from "qs";
import axios from "axios";
import { google } from "googleapis";

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
            grant_type: "authorization_code",
            redirect_uri: process.env.InstaRedirectUri,
            code: req.body.code,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
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
              grant_type: "ig_exchange_token",
              client_secret: process.env.InstaClientSecret,
              access_token: shortLivedAccessToken,
            },
          }
        );

        const { access_token: longLivedAccessToken, expires_in } =
          longLivedTokenResponse.data;
        console.log("Long-lived access token:", longLivedAccessToken);
        console.log("Expires in:", expires_in, "seconds");

        // Step 3: Fetch user data using the long-lived access token
        const userResponse = await axios.get(
          `https://graph.instagram.com/me?fields=id,username&access_token=${longLivedAccessToken}`
        );

        // Step 4: Store the long-lived access token in the database
        let instaUser = await db.SocialAuthModel.findOne({
          where: {
            userId: user.id,
          },
        });
        if (instaUser) {
          instaUser.accessToken = longLivedAccessToken;
          instaUser.name = userResponse.data.username;
          let saved = await instaUser.save();
        } else {
          instaUser = await db.SocialAuthModel.create({
            accessToken: longLivedAccessToken,
            name: userResponse.data.username,
            socialUserId: userResponse.data.id,
            userId: user.id,
          });
        }

        res.send({ status: true, message: "Auth success", data: instaUser });
      } catch (error) {
        console.error(
          "Error exchanging code for access token:",
          error.response ? error.response.data : error.message
        );
        res.send({
          status: false,
          message: `Error exchanging code for access token: ${
            error.response ? error.response.data : error.message
          }`,
          data: null,
        });
      }
    } else {
      res.send({ status: false, message: "Unauthenticated User" });
    }
  });
};

//Youtube Auth
// export const AddGoogleAuth = async (req, res) => {
//     console.log("Add Google login api", process.env.InstaClientId);

//     let {providerAccountId, idToken, accessToken, refreshToken, expiresAt} = req.body;
//     JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
//         if (authData) {
//             let user = await db.User.findByPk(authData.user.id);
//             try {

//                 // const { access_token: longLivedAccessToken, expires_in } = longLivedTokenResponse.data;
//                 // console.log("Long-lived access token:", longLivedAccessToken);
//                 console.log("Expires in:", expiresAt, "seconds");

//                 // Step 4: Store the long-lived access token in the database
//                 let googleUser = await db.GoogleAuthModel.findOne({
//                     where:{
//                         userId: user.id
//                     }
//                 })
//                 if(googleUser){
//                     googleUser.accessToken = accessToken;
//                     // instaUser.name = userResponse.data.username;
//                     let saved = await googleUser.save();
//                 }
//                 else{
//                     googleUser = await db.GoogleAuthModel.create({
//                         accessToken: accessToken,
//                         expiresAt: expiresAt,
//                         providerAccountId: providerAccountId,
//                         idToken: idToken,
//                         userId: user.id,
//                     });
//                 }

//                 res.send({ status: true, message: "Auth success", data: googleUser });
//             } catch (error) {
//                 console.error('Error exchanging code for access token:', error.response ? error.response.data : error.message);
//                 res.send({
//                     status: false,
//                     message: `Error exchanging code for access token: ${error.response ? error.response.data : error.message}`,
//                     data: null
//                 });
//             }
//         } else {
//             res.send({ status: false, message: "Unauthenticated User" });
//         }
//     });
// };

const fetchYouTubeVideos = async (accessToken) => {
  console.log("Fetching youtube videos ", accessToken);
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client,
  });

  // Get the user's channel ID
  const channelsResponse = await youtube.channels.list({
    part: "id",
    mine: true,
  });

  if (
    !channelsResponse.data.items ||
    channelsResponse.data.items.length === 0
  ) {
    throw new Error("No YouTube channel found for this user.");
  }

  const channelId = channelsResponse.data.items[0].id;
    console.log("Channel id ", channelId)
  // Fetch the user's videos
  const videosResponse = await youtube.search.list({
    part: "snippet",
    channelId: channelId,
    maxResults: 10,
    type: "video",
    order: "date",
  });
  console.log("Videos ", videosResponse)

  return videosResponse.data.items;
};

const fetchVideoCaptions = async (youtube, videoId) => {
    const captionsResponse = await youtube.captions.list({
      part: 'snippet',
      videoId: videoId,//'k_g0uYWIhm0',
    });
  
    if (!captionsResponse.data.items || captionsResponse.data.items.length === 0) {
        console.log("No captions found")
      return null; // No captions found
    }
    console.log("Captions found", captionsResponse.data.items)
    const captionId = captionsResponse.data.items[0].id;
  
    // Download the caption (in default format, usually .srt or .vtt)
    const captionResponse = await youtube.captions.download({
      id: captionId,
      tfmt: 'srt', // Change format if needed (e.g., 'vtt')
    });
  
    // Convert the caption data to a string if it's not already
    const captionData = captionResponse.data;
  
    // Ensure captionData is a string (e.g., if it's an array or object, convert to JSON or join into a string)
    return typeof captionData === 'string' ? captionData : JSON.stringify(captionData);
  };

export const AddGoogleAuth = async (req, res) => {
  console.log("Add Google login API");

  let { providerAccountId, idToken, accessToken, refreshToken, expiresAt } =
    req.body;

  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let user = await db.User.findByPk(authData.user.id);
      try {
        console.log("Expires in:", expiresAt, "seconds");

        // Step 4: Store the long-lived access token in the database
        let googleUser = await db.GoogleAuthModel.findOne({
          where: {
            userId: user.id,
          },
        });

        if (googleUser) {
          googleUser.accessToken = accessToken;
          await googleUser.save();
        } else {
          googleUser = await db.GoogleAuthModel.create({
            accessToken: accessToken,
            expiresAt: expiresAt,
            providerAccountId: providerAccountId,
            idToken: idToken,
            userId: user.id,
          });
        }

        // Fetch YouTube videos
        const videos = await fetchYouTubeVideos(accessToken);
        
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const youtube = google.youtube({ version: "v3", auth: oauth2Client });

        console.log("Fetching captions")
        // Save videos and captions to the database
        for (const video of videos) {
          const caption = await fetchVideoCaptions(youtube, video.id.videoId);
            console.log("Captions are ", caption)
            let vid = await db.YouTubeVideo.findOne({
                where: {
                    videoId: video.id.videoId
                }
            })
            if(vid){
                // await vid.destroy()
                vid.caption = caption || ''
                await vid.save();
            }
            else{
                await db.YouTubeVideo.create({
                    videoId: video.id.videoId,
                    title: video.snippet.title,
                    description: video.snippet.description,
                    thumbnailUrl: video.snippet.thumbnails.default.url,
                    caption: caption || null,
                    userId: user.id,
                  });
            }
          
        }

        res.send({
          status: true,
          message: "Google auth success and videos saved",
          data: googleUser,
        });
      } catch (error) {
        console.error(
          "Error fetching YouTube data:",
          error.message || error.response.data
        );
        res.send({
          status: false,
          message: `Error fetching YouTube data: ${
            error.message || error.response.data
          }`,
          data: null,
        });
      }
    } else {
      res.send({ status: false, message: "Unauthenticated User" });
    }
  });
};
