import db from "../models/index.js";
import JWT from "jsonwebtoken";
import qs from "qs";
import axios from "axios";
import { google } from "googleapis";
import { addToVectorDb } from "../services/pindeconedb.js";
import { constants } from "../../constants/constants.js";
import { processVideoTranscript } from "../services/kbservice.js";

const User = db.User;
const Op = db.Sequelize.Op;

export const AddInstagramAuth = async (req, res) => {
  //console.log("Add instagram login api", process.env.InstaClientId);

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
        //console.log("Short-lived access token:", shortLivedAccessToken);

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
        //console.log("Long-lived access token:", longLivedAccessToken);
        //console.log("Expires in:", expires_in, "seconds");

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
  //console.log("Fetching youtube videos ", accessToken);
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
  //console.log("Channel id ", channelId);
  // Fetch the user's videos
  const currentDate = new Date();
  const threeMonthsAgo = new Date(
    currentDate.setMonth(currentDate.getMonth() - 3)
  ).toISOString();

  const videosResponse = await youtube.search.list({
    part: "snippet",
    channelId: channelId,
    maxResults: 30,
    type: "video",
    order: "viewCount", //"date", //most popular order by views. Most recent order by date
    // publishedAfter: threeMonthsAgo,
  });
  //console.log("Videos ", videosResponse);

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
    //console.log("No captions found");
    return null; // No captions found
  }
  //console.log("Captions found", captionsResponse.data.items);
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

function getDataWithUserIdAdded(user, data) {
  const updatedData = data.map((item, index) => {
    return {
      ...item, // Spread the existing user object
      userId: user.id, // Add a new key 'userId' with a value (you can customize this)
    };
  });
  return updatedData;
}

async function AddPersonalBeliefsAndValue(json, user) {
  let traits = json.PersonaCharacteristics.PersonalValues;

  const updatedTraits = getDataWithUserIdAdded(user, traits);

  console.log("Personal Value ", updatedTraits);
  if (updatedTraits) {
    try {
      // Use await with bulkCreate to insert the users
      await db.UserValues.bulkCreate(updatedTraits, {
        updateOnDuplicate: ["title"],
      });
      console.log("Values added successfully!");
    } catch (error) {
      console.error("Error inserting users:", error);
    }
  } else {
    console.log("No Values found");
  }

  let beliefs = json.PersonaCharacteristics.PersonalBeliefs;
  const updatedBeliefs = getDataWithUserIdAdded(user, beliefs);

  console.log("Personal Value ", updatedBeliefs);
  if (updatedBeliefs) {
    try {
      // Use await with bulkCreate to insert the users
      await db.UserBeliefs.bulkCreate(updatedBeliefs, {
        updateOnDuplicate: ["title"],
      });
      console.log("Beliefs added successfully!");
    } catch (error) {
      console.error("Error inserting users:", error);
    }
  } else {
    console.log("No Beliefs found");
  }
}

async function AddTraits(json, user) {
  let traits = json.PersonaCharacteristics.PersonalityTraits;
  const updatedTraits = getDataWithUserIdAdded(user, traits);

  console.log("Personality Traits ", updatedTraits);
  if (updatedTraits) {
    try {
      // Use await with bulkCreate to insert the users
      await db.PersonalityTrait.bulkCreate(updatedTraits, {
        updateOnDuplicate: ["trait"],
      });
      console.log("Traits added successfully!");
    } catch (error) {
      console.error("Error inserting users:", error);
    }
  } else {
    console.log("No traits found");
  }
}
async function AddFrameworks(json, user) {
  let traits = json.Communication.FrameworksAndTechniques;
  const updatedTraits = getDataWithUserIdAdded(user, traits);

  console.log("Personality Traits ", updatedTraits);
  if (updatedTraits) {
    try {
      // Use await with bulkCreate to insert the users
      await db.FrameworkAndTechnique.bulkCreate(updatedTraits, {
        updateOnDuplicate: ["title"],
      });
      console.log("Frameworks added successfully!");
    } catch (error) {
      console.error("Error inserting users:", error);
    }
  } else {
    console.log("No Frameworks found");
  }
}

async function AddIntractionExample(json, user) {
  let traits = json.Communication.InteractionExamples;
  const updatedTraits = getDataWithUserIdAdded(user, traits);

  console.log("Intraction Examples ", updatedTraits);
  if (updatedTraits) {
    try {
      // Use await with bulkCreate to insert the users
      await db.IntractionExample.bulkCreate(updatedTraits, {
        updateOnDuplicate: ["question"],
      });
      console.log("Intraction Ex added successfully!");
    } catch (error) {
      console.error("Error inserting users:", error);
    }
  } else {
    console.log("No Intraction Ex found");
  }
}

async function AddAllData(json, user) {
  console.log("Json to add ", json);
  try {
    console.log("Adding Traits");
    await AddTraits(json, user);
  } catch (error) {
    console.log("Error Adding Traits", error);
  }
  try {
    console.log("Adding Frameworks");
    await AddFrameworks(json, user);
  } catch (error) {
    console.log("Error Adding Frame", error);
  }
  try {
    console.log("Adding Beliefs");
    await AddPersonalBeliefsAndValue(json, user);
  } catch (error) {
    console.log("Error Adding Beliefs And Values", error);
  }
  try {
    console.log("Adding Intractions");
    await AddIntractionExample(json, user);
  } catch (error) {
    console.log("Error Adding Intractions", error);
  }
}

export const fetchVideoCaptionsAndProcessWithPrompt = async (
  videoId,
  user,
  video
) => {
  let data = "";

  console.log("Fetching Transcript", user.id);
  // return;
  let transcript = video.caption;
  if (transcript == null || transcript == "") {
    console.log("Dont have transcript. Fetching New");
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://www.searchapi.io/api/v1/search?api_key=cYNn3AVjaS2eVN9yz75YbCCf&engine=youtube_transcripts&video_id=${videoId}`,
      headers: {
        Authorization: "Bearer cYNn3AVjaS2eVN9yz75YbCCf",
      },
      data: data,
    };

    let response = await axios.request(config);
    let resData = response.data;
    // console.log("Fetched Transcript", response);

    resData.transcripts.map((t) => {
      transcript += t.text;
    });
  } else {
    console.log("Already have transcript. Using that.");
  }

  console.log("Fetching Summary", videoId);

  //add the transcript to vdb
  let trans = transcript;
  // if (video.LabeledTranscript) {
  //   trans = video.LabeledTranscript;
  // }
  let summary = await processVideoTranscript(trans, user, video);
  video.summary = summary.summary || "";
  let saved1 = await video.save();
  try {
    let json = JSON.parse(summary.summary);
    let metaData = null;
    if (json) {
      try {
        const metaData = {
          MainPoints: json.AdditionalContent?.MainPoints ?? "",
          KeyTopics: json.AdditionalContent?.KeyTopics ?? "",
          FrameworksModels: json.AdditionalContent?.FrameworksModels ?? "",
          videoDbId: video?.id ?? "",
          videoTitle: video?.title ?? "",
        };
        if (!video.addedToDb && json.LabeledTranscript) {
          let added = await addToVectorDb(
            transcript, //json.LabeledTranscript,
            user,
            "youtube",
            metaData
          );
          if (added) {
            console.log("Added to vector db");
            video.addedToDb = true;
            // return res.send({ message: "Added", status: true, data: added });
          }
        } else {
          console.log("Already added to vdb");
        }
        //add the personality traits to the db table
        await AddAllData(json, user);
      } catch (error) {
        console.log("error while scraping data from json");
        console.log(error);
      }
    }
  } catch (error) {
    console.log("Error parsing json");
    console.log(error);
  }

  video.caption = transcript;

  video.tokensUsed = summary.tokensUsed || 0;
  video.cost = summary.cost || 0;
  let saved = await video.save();
  // console.log("Fetched Summary", summary.summary);
  //Summarize here
};

// The function to summarize transcript using the GPT-4 model

//################## Youtube Auth START ####################
export const AddGoogleAuth = async (req, res) => {
  //console.log("Add Google login API");

  let { providerAccountId, idToken, accessToken, refreshToken, expiresAt } =
    req.body;

  JWT.verify(req.token, process.env.SecretJwtKey, async (error, authData) => {
    if (authData) {
      let user = await db.User.findByPk(authData.user.id);
      let youtubeDetails = await fetchYouTubeUserDetails(accessToken);
      try {
        //console.log("Expires in:", expiresAt, "seconds");

        // Step 4: Store the long-lived access token in the database
        let googleUser = await db.GoogleAuthModel.findOne({
          where: {
            userId: user.id,
          },
        });

        if (googleUser) {
          googleUser.accessToken = accessToken;
          googleUser.username = youtubeDetails.username;
          googleUser.description = youtubeDetails.description;
          googleUser.location = youtubeDetails.location;
          googleUser.subscriberCount = youtubeDetails.subscriberCount;
          googleUser.videoCount = youtubeDetails.videoCount;
          googleUser.viewCount = youtubeDetails.viewCount;
          googleUser.profilePicture = youtubeDetails.profilePicture;
          googleUser.website = youtubeDetails.website || null;
          googleUser.emailPublic = youtubeDetails.emailPublic || null;
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

        //console.log("Fetching captions");
        // Save videos and captions to the database
        for (const video of videos) {
          const caption = await fetchVideoCaptions(youtube, video.id.videoId);
          //console.log("Captions are ", caption);
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
      //console.log("NO channel found for the user");
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
    //console.log("YoutubeDataFetched", data);
    return data;
  } catch (error) {
    console.error("Error fetching YouTube user details:", error);
    throw new Error("Failed to fetch YouTube user details.");
  }
};
//################## Youtube Auth END ####################
