import db from "../models/index.js";
import JWT from "jsonwebtoken";
import qs from "qs";
import axios from "axios";
import { google } from "googleapis";

const User = db.User;
const Op = db.Sequelize.Op;

import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

export const ScrapeTweets = async (req, res) => {
  let url = req.body.url;
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Set User-Agent to avoid being blocked
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2" });

    let tweets = [];
    let previousTweetCount = 0;
    const maxScrolls = 30; // Increase the number of scrolls
    let scrollCount = 0;

    while (tweets.length < 100 && scrollCount < maxScrolls) {
      // Extract tweets from the page
      const newTweets = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("article div[lang]")).map(
          (tweet) => tweet.innerText
        );
      });

      tweets = [...tweets, ...newTweets];
      tweets = [...new Set(tweets)]; // Remove duplicates
      console.log("Twwets", tweets);
      // If no new tweets were loaded, break the loop
      if (tweets.length === previousTweetCount) {
        console.log("No more tweets loaded, breaking out of the loop.");
        break;
      }

      previousTweetCount = tweets.length;

      // Scroll down
      await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");

      // Wait longer between scrolls to allow new content to load
      await new Promise((resolve) => setTimeout(resolve, 4000));

      scrollCount++;
    }

    await browser.close();
    // console.log(tweets);
    return res.send({ status: true, message: "Tweets", data: tweets });
  } catch (error) {
    console.error("Error fetching the URL:", error);
    return res.send({
      status: false,
      message: "Error fetching the URL:",
      data: null,
    });
  }
};

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
  console.log("Channel id ", channelId);
  // Fetch the user's videos
  const currentDate = new Date();
  const threeMonthsAgo = new Date(currentDate.setMonth(currentDate.getMonth() - 3)).toISOString();

  const videosResponse = await youtube.search.list({
    part: "snippet",
    channelId: channelId,
    maxResults: 30,
    type: "video",
    order: "date",
    publishedAfter: threeMonthsAgo,
  });
  console.log("Videos ", videosResponse);

  return videosResponse.data.items;
};

const fetchVideoCaptions = async (youtube, videoId) => {
  const captionsResponse = await youtube.captions.list({
    part: "snippet",
    videoId: videoId, //'k_g0uYWIhm0',
  });

  if (
    !captionsResponse.data.items ||
    captionsResponse.data.items.length === 0
  ) {
    console.log("No captions found");
    return null; // No captions found
  }
  console.log("Captions found", captionsResponse.data.items);
  const captionId = captionsResponse.data.items[0].id;

  // Download the caption (in default format, usually .srt or .vtt)
  const captionResponse = await youtube.captions.download({
    id: captionId,
    tfmt: "srt", // Change format if needed (e.g., 'vtt')
  });

  // Convert the caption data to a string if it's not already
  const captionData = captionResponse.data;

  // Ensure captionData is a string (e.g., if it's an array or object, convert to JSON or join into a string)
  return typeof captionData === "string"
    ? captionData
    : JSON.stringify(captionData);
};

//################## Youtube Auth START ####################
export const AddGoogleAuth = async (req, res) => {
  console.log("Add Google login API");

  let { providerAccountId, idToken, accessToken, refreshToken, expiresAt } =
    req.body;

  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let user = await db.User.findByPk(authData.user.id);
      let youtubeDetails = await fetchYouTubeUserDetails(accessToken);
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
          googleUser.username = youtubeDetails.username
          googleUser.description = youtubeDetails.description
          googleUser.location = youtubeDetails.location
          googleUser.subscriberCount = youtubeDetails.subscriberCount
          googleUser.videoCount = youtubeDetails.videoCount
          googleUser.viewCount = youtubeDetails.viewCount
          googleUser.profilePicture = youtubeDetails.profilePicture
          googleUser.website = youtubeDetails.website || null
          googleUser.emailPublic = youtubeDetails.emailPublic || null
          await googleUser.save();
        } else {
          googleUser = await db.GoogleAuthModel.create({
            accessToken: accessToken,
            expiresAt: expiresAt,
            providerAccountId: providerAccountId,
            idToken: idToken,
            userId: user.id,
            username: youtubeDetails.username,
            description: youtubeDetails.description,
            location: youtubeDetails.location,
            subscriberCount: youtubeDetails.subscriberCount,
            videoCount: youtubeDetails.videoCount,
            viewCount: youtubeDetails.viewCount,
            profilePicture: youtubeDetails.profilePicture,
            website: youtubeDetails.website || null,
            emailPublic: youtubeDetails.emailPublic || null,
          });
        }

        // Fetch YouTube videos
        const videos = await fetchYouTubeVideos(accessToken);

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const youtube = google.youtube({ version: "v3", auth: oauth2Client });

        console.log("Fetching captions");
        // Save videos and captions to the database
        for (const video of videos) {
          const caption = await fetchVideoCaptions(youtube, video.id.videoId);
          console.log("Captions are ", caption);
          let vid = await db.YouTubeVideo.findOne({
            where: {
              videoId: video.id.videoId,
            },
          });
          if (vid) {
            // await vid.destroy()
            vid.caption = caption || "";
            await vid.save();
          } else {
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

export const TestUserYoutubeDetails = async (req, res) => {
  let token = req.body.accessToken;
  let details = fetchYouTubeUserDetails(token);
  return res.send({ status: true, data: details });
};

const fetchYouTubeUserDetails = async (accessToken) => {
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    const response = await youtube.channels.list({
      part: "snippet,statistics,brandingSettings",
      mine: true,
    });

    const channel = response.data.items[0];

    if (!channel) {
      console.log("NO channel found for the user");
      throw new Error("No channel found for the authenticated user.");
    }

    let data = {
      username: channel.snippet.title,
      description: channel.snippet.description,
      location: channel.snippet.country,
      subscriberCount: channel.statistics.subscriberCount,
      videoCount: channel.statistics.videoCount,
      viewCount: channel.statistics.viewCount,
      profilePicture: channel.snippet.thumbnails.default.url,
      website: channel.brandingSettings.channel.unsubscribedTrailer || null,
      emailPublic: channel.snippet.customUrl || null, // This field might not be accessible depending on privacy settings
    };
    console.log("YoutubeDataFetched", data);
    return data;
  } catch (error) {
    console.error("Error fetching YouTube user details:", error);
    throw new Error("Failed to fetch YouTube user details.");
  }
};
//################## Youtube Auth END ####################
