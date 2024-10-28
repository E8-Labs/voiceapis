import nodeCron from "node-cron";
import db from "./src/models/index.js";
import { GetACall } from "./src/controllers/call.controller.js";
import { ChargeCustomer } from "./src/services/stripe.js";
// import { fetchVideoCaptionsAndProcessWithPrompt } from "./src/controllers/socialauth.controller.js";

import { ScrapWebUrl } from "./src/controllers/scraping.controller.js";
import dotenv from "dotenv";
dotenv.config();
// import { KbProcessingCron } from "./src/controllers/buildai.controller.js";
import {
  ProcessDocumentAndTextKb,
  fetchVideoCaptionsAndProcessWithPrompt,
} from "./src/services/kbservice.js";

import { GetUsersHavingNoObjectiveAndProfession } from "./src/services/OneTimeCronServices.js";
import { CheckIfGeneratePromptFirstTime } from "./src/services/MasterPromptService.js";

// import { LabelVideoTranscript } from "./src/services/kbservice.js";

//Running? No
// async function rechargeUsersAccounts() {
//   let users = await db.User.findAll({
//     where: {
//       seconds_available: {
//         [db.Sequelize.Op.lte]: 120,
//       },ve
//     },
//   });
//   //console.log(`${users.length} Users have less than 2 minutes`);

//   if (users && users.length > 0) {
//     for (let i = 0; i < users.length; i++) {
//       let u = users[i];
//       let amount = 1000;
//       //console.log(`User ${u.email} has balance `, u.seconds_available);
//       let charge = await ChargeCustomer(
//         amount,
//         u,
//         "Recharged 10 minutes",
//         "Charge for 10 minutes. Balance dropped below 2 minutes."
//       );
//       // //console.log("Charged in user is ", charge);
//       // call.paymentStatus = charge.reason;
//       if (charge.payment) {
//         // call.paymentId = charge.payment.id;
//         // call.paymentAmount = charge.payment.amount;

//         // let saved = await call.save();
//         u.seconds_available = u.seconds_available + 600;
//         let userSaved = await u.save();
//         //console.log("User call time updated in user", u.seconds_available);
//       }
//       // call.chargeDescription = charge.message;
//     }
//   }
// }
// const jobUserTopup = nodeCron.schedule("*/2 * * * *", rechargeUsersAccounts);
// jobUserTopup.start();

//calls that were not charged for some reason - Yes

//Running - Yes

async function getCompletedCallsNotCharged() {
  console.log("Running cron job Completed Calls");
  try {
    let calls = await db.CallModel.findAll({
      where: {
        status: {
          [db.Sequelize.Op.in]: ["completed", "hangup_on_voicemail"],
        },
        paymentStatus: {
          [db.Sequelize.Op.ne]: "succeeded",
        },
      },
    });
    //console.log("Calls pending cahrge found: ", calls.length);
    //getCompletedCallsNotCharged
    if (calls && calls.length > 0) {
      for (let i = 0; i < calls.length; i++) {
        let call = calls[i];
        let callId = call.callId;
        //console.log("Getting call id ", callId);
        let ai = await db.UserAi.findOne({
          where: { userId: call.modelId },
        });
        let duration = call.duration; //in seconds
        let pricePerMin = Number(ai.price) || 0;
        let amount = (duration * pricePerMin) / 60; //(10 / 60) * duration * 100; //10 / 60 => amount per second & then x 100 to convert to cents

        let user = await db.User.findOne({
          where: {
            userId: call.userId,
          },
        });
        if (user) {
          if (user.seconds_available - duration < 1) {
            //charge user

            // if (user) {
            //We are using hardcoded amount of $10 for now. A minite is worth $1. So we will add 10 minutes for now
            //to the user's call time
            let charge = await ChargeCustomer(
              amount,
              user,
              `Call Charged ${call.callId}`,
              `Charge for ${duration} seconds.`
            );
            // //console.log("Charge is ", charge);
            call.paymentStatus = charge.reason;
            if (charge.payment) {
              call.paymentId = charge.payment.id;
              call.paymentAmount = charge.payment.amount;
            } else {
              call.paymentStatus = "error";
            }
            call.chargeDescription = charge.message;

            let saved = await call.save();
            user.seconds_available = 0;
            let userSaved = await user.save();
            //console.log("User call time updated ", user.seconds_available);
            // } else {
            //   //console.log("No user to charge");
            // }
          } else {
            user.seconds_available = user.seconds_available - duration;
            let saved = await user.save();
            //console.log("User call time updated ", user.seconds_available);
          }
        } else {
          //console.log("No user to charge");
        }
        call.paymentStatus = "Succeeded";
        let callSaved = await call.save();
      }
    }
  } catch (error) {
    //console.log("Error ", error);
  }
}
const jobCharges = nodeCron.schedule(
  "*/30 * * * * *",
  getCompletedCallsNotCharged
);
jobCharges.start();

// const webScrapperJob = nodeCron.schedule("*/15 * * * * *", ScrapWebUrl);
// webScrapperJob.start();

//Youtube Video Summary Generation Cron
async function ProcessLabelledTranscript() {
  console.log("Cron Fetch Youtube Summary");
  let videos = await db.YouTubeVideo.findAll({
    where: {
      summary: {
        [db.Sequelize.Op.is]: null,
      },
      caption: {
        [db.Sequelize.Op.or]: [
          { [db.Sequelize.Op.is]: null },
          { [db.Sequelize.Op.ne]: "error" },
        ],
      },
    },
  });

  if (videos) {
    console.log("Videos Found :", videos.length);
    for (let i = 0; i < videos.length; i++) {
      let v = videos[i];
      let user = await db.User.findByPk(v.userId);
      fetchVideoCaptionsAndProcessWithPrompt(v.videoId, user, v);
    }
  }

  let videosNotLabelled;
}

//Youtube Kb Cron - Yes
const YoutubeSummaryCronJob = nodeCron.schedule(
  "*/5 * * * *",
  ProcessLabelledTranscript
);
YoutubeSummaryCronJob.start();

// ProcessLabelledTranscript();
// async function FindAndLabelYoutubeVideos() {
//   console.log("Cron Fetch Youtube Labeled Transcript");
//   let videos = await db.YouTubeVideo.findAll({
//     where: {
//       labeledTranscript: {
//         [db.Sequelize.Op.is]: null,
//       },
//     },
//   });

//   if (videos) {
//     console.log("Videos Not Labelled Found :", videos.length);
//     for (let i = 0; i < videos.length; i++) {
//       let v = videos[i];
//       let user = await db.User.findByPk(v.userId);
//       if (v.caption != null && v.caption != "") {
//         let labeled = await LabelVideoTranscript(v.caption, user, v);
//         if (labeled && labeled.labeledTranscript) {
//           v.labeledTranscript = labeled.labeledTranscript;
//           let saved = await v.save();
//           console.log("Video labeled and saved");
//         }
//       }
//     }
//   }

//   let videosNotLabelled;
// }

//Youtube Kb Cron - No
// const YoutubeLabelCronJob = nodeCron.schedule(
//   "*/2 * * * *",
//   FindAndLabelYoutubeVideos
// );
// YoutubeLabelCronJob.start();

//Document Kb Cron - Yes
const KbCron = nodeCron.schedule("*/17 * * * *", ProcessDocumentAndTextKb);
KbCron.start();
// ProcessDocumentAndTextKb();

//Objective Cron - No - We will handle with api
// const ObjectiveCron = nodeCron.schedule(
//   "*/9 * * * *",
//   GetUsersHavingNoObjectiveAndProfession
// );
// ObjectiveCron.start();
// GetUsersHavingNoObjectiveAndProfession();
