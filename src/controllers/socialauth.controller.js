import db from "../models/index.js";
import JWT from "jsonwebtoken";
import qs from "qs";
import axios from "axios";
import { google } from "googleapis";

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

export const fetchVideoCaptionsAndSummary = async (videoId, user, video) => {
  let data = "";

  console.log("Fetching Transcript", videoId);
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
  let summary = await summarizeText(transcript, user, video);
  video.caption = transcript;
  video.summary = summary.summary || "";
  video.tokensUsed = summary.tokensUsed || 0;
  video.cost = summary.cost || 0;
  let saved = await video.save();
  console.log("Fetched Summary", summary.summary);
  //Summarize here
};

// The function to summarize text using the GPT-4 model
async function summarizeText(transcript, user, video) {
  // console.log("Transcript ", transcript);
  const model = "gpt-4-turbo"; // You specified gpt-4, or it can be "gpt-4-turbo"
  const apiUrl = "https://api.openai.com/v1/chat/completions";

  // Pricing details for GPT-4
  const pricePer1000Tokens = 0.03; // $0.03 per 1K tokens for GPT-4 (adjust this based on OpenAI's pricing)

  try {
    // Make the request to the OpenAI API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AIKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: `##Objective:
Your goal is to process the transcript from a YouTube video by ${
              user.name || ""
            }, breaking it into manageable chunks of 2000 words. For each chunk, extract the key points, topics, frameworks, and lessons, then generate conversational prompt/response pairs. These pairs should reflect the speaker’s voice, tone, and style, ensuring natural, human-like engagement with intonations, transitional words, and conversational elements such as "umm" and "hmm."
Additionally, ensure that responses are contextually relevant and consistent with the speaker's perspective, always anticipating follow-up questions that the audience may ask.
##Transcript Detail:
This transcript is about the video titled ${video.title} by ${
              user.name || ""
            }. There may be one or more speakers in this transcript; label the speakers accurately as ${
              user.name || ""
            }, speaker 1, speaker 2, etc. You must distinguish each speaker clearly to maintain accurate context throughout.

##Step 1: Chunk the Transcript
Chunk the transcript into manageable sections of 2000 words. This range ensures each section is detailed enough to capture key elements while staying within optimal token limits. Each chunk should be labeled based on the word range within the transcript, like so:
Chunk 1: (First word in chunk - Last word in chunk)
For each chunk, identify and extract the following elements:
Main Points: Summarize the essential information or central argument for the chunk.
Key Topics: List the primary subjects or themes covered in the chunk.
Frameworks/Models: Identify any strategies, frameworks, or models mentioned.
Lessons: Highlight the key lessons or takeaways for the listeners.
Key Message: Summarize the core message that the speaker(s) wants to convey.
Speaker’s Perspective: Provide the speaker's unique viewpoint on the topic.
Personal Stories: Identify any personal anecdotes or stories shared by the speaker(s).
Common Questions: Anticipate typical questions that listeners might ask based on the content.
Format Example:
Chunk 1 (First word - Last word):
Main Points:
Key Topics:
Frameworks/Models:
Lessons:
Key Message:
Speaker’s Perspective:
Personal Stories:
Common Questions:

##Step 2: Create Prompt/Response Pairs for Each Chunk
For each chunk, create conversational prompt/response pairs that reflect the key points, frameworks, and lessons discussed. These pairs should cover potential user prompts and the speaker’s natural, human-like responses.
Response Tone: Ensure the response imitates the speaker’s tone, whether it's formal, casual, instructional, or motivational. If the speaker uses humor, strong opinions, or motivational phrases, reflect this in the response.
Natural Speech Elements: Include conversational elements like intonations, pauses, filler words (e.g., “umm,” “hmm”), and transitional phrases to create a realistic and engaging conversation flow.
Prompts to Cover: Ensure that the prompts cover possible user inquiries about the main points, frameworks, lessons, and speaker perspectives from each chunk. Prompts can range from broad questions (e.g., "What was the key message of this section?") to specific queries (e.g., "Can you explain the speaker’s perspective on X?").
Prompt/Response Example:
Prompt: "What was the key message in the second part of the video?"
Response (in the speaker’s voice): "Well, the main thing I wanted to convey here is that success doesn’t happen overnight. You need discipline and the right mindset to make it happen. No shortcuts. You have to stay consistent, even when things get tough—there’s no way around it."
Prompt: "How does the speaker recommend prioritizing tasks?"
Response (in the speaker’s voice): "Prioritization is key. I always tell people to focus on what moves the needle the most. Stop wasting time on low-impact tasks and start putting energy into the things that matter—whether it’s your career, relationships, or personal growth."

##Step 3: Ensure Relevance and Consistency
Contextual Relevance: Always refer back to the key message and focus of the video to keep responses relevant to the video’s content. Ensure that responses align with the speaker’s intended tone and style.
Consistency in Speaker’s Voice: Keep the speaker’s tone consistent throughout the responses. If the speaker uses a motivational or direct tone, ensure this remains the same in all prompt/response pairs. Avoid shifting styles.
Flow of Conversation: Keep the dialogue engaging and natural, with transitions between topics where necessary. Responses should sound conversational, rather than robotic or overly formal.
`,
          },
          {
            role: "user",
            content: `Here is the transcript: ${transcript}`,
          },
        ],
        max_tokens: 3000, // Limit the number of tokens for the response (adjust as needed)
      }),
    });

    // Parse the response
    const result = await response.json();

    // Extract tokens used and summary from the response
    console.log("GPT Response ", result);
    const summary = result.choices[0].message.content;
    const tokensUsed = result.usage.total_tokens;
    const cost = (tokensUsed / 1000) * pricePer1000Tokens;

    // Return the summary, token count, and cost in a JSON object
    return {
      summary: summary,
      tokensUsed: tokensUsed,
      cost: cost.toFixed(4), // Formatting cost to 4 decimal places
    };
  } catch (error) {
    console.error("Error summarizing text:", error);
    return {
      error: error.message,
    };
  }
}

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
