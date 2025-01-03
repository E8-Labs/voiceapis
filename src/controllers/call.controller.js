import axios from "axios";
import db from "../models/index.js";
import { loadCards } from "../services/stripe.js";
import CallLiteResource from "../resources/callliteresource.js";
import OpenAI from "openai";
import { ChargeCustomer } from "../services/stripe.js";
import { constants } from "../../constants/constants.js";
import { SendMail } from "../services/maileservice.js";
// import Assistant from "../models/assistants.model.js";

// export const MakeACall = async(req, res) => {

//     res.send({status: true, message: "call is initiated", data: {someData: "This is some data here"}})
// }

async function PushDataToGhl(firstName, lastName, email, phone, callId) {
  let data = JSON.stringify({
    email: email,
    phone: phone,
    firstName: firstName,
    lastName: lastName,
    name: `${firstName} ${lastName}`,
    source: "public api",
    customField: {
      __custom_field_call_id__: callId,
    },
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://rest.gohighlevel.com/v1/contacts/",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6IjVrWW5kcjhMTlBuRnpZcmwzZ0pPIiwidmVyc2lvbiI6MSwiaWF0IjoxNzIzNDQ1NTIwMjgyLCJzdWIiOiJaT3RBV2VQUGFnTzgzY2NvT0swNyJ9.sUzwtXp7HaS1G3tkEQGfjFU22nl8Y5RSt25QFNjpb6w",
    },
    data: data,
  };

  try {
    const response = await axios.request(config);
    //console.log("Data from ghl");
    //console.log(JSON.stringify(response.data));
    return true;
  } catch (error) {
    //console.log("Error from ghl");
    //console.log(error);
    return false;
  }
}

export const MakeACall = async (req, res) => {
  // setLoading(true);
  let PhoneNumber = req.body.phone;
  let Name = req.body.name;
  let LastName = req.body.lastName || "";
  let Email = req.body.email;
  let model = req.body.model || "tate";
  let modelId = req.body.modelId;

  let assistant = await db.Assistant.findOne({
    where: {
      userId: modelId,
    },
  });

  if (!assistant) {
    console.log("No Assistant for", modelId);
    return res.send({
      status: false,
      message: "No such assistant",
      data: modelId,
      reason: "no_such_assistant",
    });
  }
  let assistantUser = await db.User.findByPk(assistant.userId);
  if (assistantUser.role == "creator") {
    //check voice added
    let ai = await db.UserAi.findOne({ where: { userId: assistantUser.id } });
    if (ai && ai.audio) {
    } else {
      return res.send({
        status: true,
        message: "This creator can not receive calls right now.",
      });
    }
  }

  let user = await db.User.findOne({
    where: {
      phone: PhoneNumber,
    },
  });

  let calls = await db.CallModel.findAll({
    where: {
      phone: PhoneNumber,
      modelId: modelId,
    },
  });

  if (user) {
    //check whether the user allows Trial
    if (assistant.allowTrial) {
      console.log("Assistant allows trial");
      //If yes
      //check the number of calls of this user with this model
      if (calls && calls.length >= 30) {
        return res.send({
          status: false,
          message: "You've reached your maximum of 3 free calls.",
          data: null,
          reason: "max_call_limit_trial_user_reached",
          calls: calls.length,
        });
      }
    }

    // user is in the database.

    //The below logic is discarded enclosed in #####
    //###########################################################################
    //check if he has pending previous transactions
    let callsNotCharged = await db.CallModel.findAll({
      where: {
        status: {
          [db.Sequelize.Op.in]: ["completed", "hangup_on_voicemail"],
        },
        paymentStatus: {
          [db.Sequelize.Op.ne]: "succeeded",
        },
        userId: user.id,
        // phone: {
        //   [db.Sequelize.Op.like]: `%${PhoneNumber}%`
        // }
      },
    });
    //###########################################################################

    if (user.seconds_available <= 0) {
      //
      let cards = await loadCards(user);
      //if the assistant allows trial then no need to block user from calling
      if ((cards && cards.length > 0) || assistant.allowTrial) {
        // we will think of the logic here.
        //Check if previous transactions to be charged
        if (callsNotCharged && callsNotCharged.length > 0) {
          //try charging. Most probably only one call that might not have been charged.
          let dbCall = callsNotCharged[0];
          let dbCallAssistant = await db.Assistant.findOne({
            where: { userId: dbCall.modelId },
          });
          let charged = await chargeUser(user, dbCall, dbCallAssistant);
          if (!charged) {
            return res.send({
              status: false,
              message: "Could not process previous charges.",
              data: null,
              reason: "previous_charge_failed",
            });
          }
        }
      } else {
        return res.send({
          status: false,
          message: "No payment source added to top up your account",
          data: null,
          reason: "no_payment_source",
        });
      }
    } else {
    }
  } else {
    return res.send({
      status: false,
      message: "User with this phone number does not exist",
      data: null,
      reason: "no_such_user",
    });
  }

  console.log("Calling assistant", assistant.name);
  console.log("Model ", assistant.modelId);
  try {
    let basePrompt = assistant.prompt;
    basePrompt = basePrompt.replace(/{prospect_name}/g, Name);
    basePrompt = basePrompt.replace(/{phone}/g, PhoneNumber);
    basePrompt = basePrompt.replace(/{email}/g, Email);
    // kbPrompt = kbPrompt.replace(/{username}/g, user.username);
    //find if any previous calls exist
    console.log("#############################################\n");
    console.log("Base prompt being sent ", basePrompt);
    console.log("#############################################\n");

    console.log(`Calls for phone ${PhoneNumber} `, calls.length);
    for (let i = 0; i < calls.length; i++) {
      let call = calls[i];
      basePrompt = `${basePrompt}\n${call.transcript}`;
    }

    //   const axios = require('axios');
    // console.log("Base Prompt is  ", basePrompt)
    let data = JSON.stringify({
      name: Name,
      phone: PhoneNumber,
      model: assistant.modelId, //"1722652829145x214249543190325760",
      prompt: basePrompt,
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://fine-tuner.ai/api/1.1/wf/v2_voice_agent_call",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${assistant.apikey}`,
      },
      data: data,
    };

    axios
      .request(config)
      .then(async (response) => {
        let json = response.data;
        console.log(json);
        if (json.status === "ok" || json.status === "success") {
          let callId = json.response.call_id;
          let savedToGhl = await PushDataToGhl(
            Name,
            LastName,
            Email,
            PhoneNumber,
            callId
          );
          let saved = await db.CallModel.create({
            callId: callId,
            phone: PhoneNumber,
            transcript: "",
            summary: "",
            duration: "",
            status: "",
            model: assistant.name,
            modelId: assistant.userId,
            paymentStatus: "",
            chargeDescription: "",
            userId: user.id,
          });
          console.log("Saved ", saved);
          res.send({ status: true, message: "call is initiated ", data: json });
        } else {
          let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error Notification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
    }
    .content {
      font-size: 16px;
      color: #333;
      line-height: 1.5;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 14px;
      color: #888;
    }
    .error {
      color: #D8000C;
      background-color: #FFD2D2;
      border: 1px solid #D8000C;
      padding: 10px;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Error Notification</h2>
    </div>
    <div class="content">
      <p>Dear Team,</p>
      <p>An error occurred while attempting to start a voice call. Below are the details:</p>
      <div class="error">
        <p><strong>Status:</strong> Error</p>
        <p><strong>Message:</strong> ${json.response.answer}.</p>
        <p><strong>Model ID:</strong> ${assistant.modelId}</p>
      </div>
      <p>Please review the issue and take appropriate action.</p>
      <p>Best regards,</p>
      <p>Your Automated Notification System</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 Your Company. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>
`;
          let sent = SendMail(
            "noahdeveloperr@gmail.com",
            "Call Failed",
            "",
            html
          );
          let sentSalman = SendMail(
            "salman@e8-labs.com",
            "Call Failed",
            "",
            html
          );
          console.log("Emails sent ", sentSalman);
          res.send({
            status: false,
            message: "call is not initiated",
            data: json,
          });
        }
      })
      .catch((error) => {
        console.log(error);

        ///check and send email
        let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error Notification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
    }
    .content {
      font-size: 16px;
      color: #333;
      line-height: 1.5;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 14px;
      color: #888;
    }
    .error {
      color: #D8000C;
      background-color: #FFD2D2;
      border: 1px solid #D8000C;
      padding: 10px;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Error Notification</h2>
    </div>
    <div class="content">
      <p>Dear Team,</p>
      <p>An error occurred while attempting to start a voice call. Below are the details:</p>
      <div class="error">
        <p><strong>Status:</strong> Error</p>
        <p><strong>Message:</strong> ${error.response.answer}.</p>
        <p><strong>Model ID:</strong> ${assistant.modelId}</p>
      </div>
      <p>Please review the issue and take appropriate action.</p>
      <p>Best regards,</p>
      <p>Your Automated Notification System</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 Your Company. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>
`;
        let sent = SendMail(
          "noahdeveloperr@gmail.com",
          "Call Failed",
          "",
          html
        );
        let sentSalman = SendMail(
          "salman@e8-labs.com",
          "Call Failed",
          "",
          html
        );
        console.log("Emails sent ", sentSalman);
        res.send({
          status: false,
          message: "call is not initiated",
          data: null,
        });
      });
  } catch (error) {
    console.error("Error occured is :", error);
    res.send({ status: false, message: "call is not initiated", data: null });
  }
};

export const GetACall = async (callId) => {
  //    let callId = req.query.callId

  try {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://fine-tuner.ai/api/1.1/wf/v2_voice_agent_transcript?call_id=${callId}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer 1722652770290x657720203450142300",
      },
    };

    let response = await axios.request(config);
    // .then(async (response) => {

    // //console.log(response);
    if (response.status == 200) {
      let json = response.data;
      //console.log("Call data success");
      let data = json[0];
      // //console.log("Call data is ", data);
      let dbCall = await db.CallModel.findOne({
        where: {
          callId: callId,
        },
      });
      if (
        dbCall &&
        (dbCall.status === "" ||
          dbCall.status == null ||
          dbCall.status == "in-progress" ||
          dbCall.status == "initiated" ||
          dbCall.status == "pending")
      ) {
        //console.log("Updating call in db");
        dbCall.transcript = data.transcript;
        dbCall.status = data.status;
        dbCall.duration = data.duration;
        let updated = await dbCall.save();
        //console.log("Db call updated");

        let caller = await db.User.findByPk(dbCall.userId);
        let model = await db.User.findByPk(dbCall.modelId);

        if (dbCall.transcript != "" && dbCall.transcript != null) {
          let previousSummaryRow = await db.UserCallSummary.findOne({
            where: {
              userId: caller.id,
              modelId: model.id,
            },
          });

          let prevSummary = "";
          if (previousSummaryRow) {
            prevSummary = previousSummaryRow.summary;
          }
          const gptSummary = await generateGptSummary(
            dbCall.transcript,
            model,
            caller,
            prevSummary
          );
          dbCall.summary = gptSummary;
          let updatedSummaryForCall = await dbCall.save();
          // Save the summary in the UserCallSummary table
          if (previousSummaryRow) {
            previousSummaryRow.summary = gptSummary;
            let saved = await previousSummaryRow.save();
            console.log("Summary for call updated", dbCall.callId);
          } else {
            await db.UserCallSummary.create({
              name: `Summary for Call ${callId}`,
              userId: dbCall.userId, // Assuming userId is part of dbCall
              modelId: dbCall.modelId, // Assuming modelId is part of dbCall
              summary: gptSummary, // Assuming you've added this column to the model
            });
          }

          //console.log("Summary saved in UserCallSummary");
        }
      }
      return { status: true, message: "call obtained", data: dbCall };
      res.send({ status: true, message: "call obtained", data: dbCall });
    } else {
      //console.log("Call not obtained ", response);
      return { status: false, message: "call not obtained", data: response };
      res.send({ status: false, message: "call not obtained", data: response });
    }

    // })
    // .catch((error) => {
    //   //console.log(error);
    //   return {status: false, message: "call not obtained", data: null}
    //   res.send({status: false, message: "call not obtained", data: null})
    // });
  } catch (error) {
    console.error("Error occured is :", error);
    return { status: false, message: "Call data error", error: error };
    res.send({ status: false, message: "call not obtained", data: null });
  }
};

export const GetRecentAndOngoingCalls = async (req, res) => {
  let model = req.query.model || 6; // by default tate

  // Fetch dummy calls
  let calls = await db.CallModel.findAll({
    where: {
      status: {
        [db.Sequelize.Op.in]: [
          "completed",
          "in-progress",
          "hangup_on_voicemail",
        ],
      },
      [db.Sequelize.Op.or]: [
        {
          userId: {
            [db.Sequelize.Op.between]: [16, 37],
          },
        },
      ],
    },
    order: [["createdAt", "DESC"]],
    limit: 20,
  });

  console.log("UsersDummy", calls.length);
  // Fetch actual calls created in the last 60 minutes
  let callsActual = await db.CallModel.findAll({
    where: {
      status: {
        [db.Sequelize.Op.in]: [
          "completed",
          "in-progress",
          "hangup_on_voicemail",
        ],
      },
      createdAt: {
        [db.Sequelize.Op.gte]: new Date(new Date() - 60 * 60 * 1000 * 48), // Last 48 hours
      },
    },
    order: [["createdAt", "DESC"]],
    limit: 20,
  });
  console.log("UserACTUAL", callsActual.length);
  //console.log('Actual Calls ', callsActual )

  // Combine the calls and filter for unique calls based on callerId and callId
  let uniqueCallers = new Set();
  let uniqueCalls = new Set();
  let allCalls = [...calls, ...callsActual];
  // .filter((call) => {
  //   if (!uniqueCallers.has(call.userId) && !uniqueCalls.has(call.id)) {
  //     uniqueCallers.add(call.userId);
  //     uniqueCalls.add(call.id);
  //     return true;
  //   }
  //   return false;
  // });

  // Get the call resource data
  let callsRes = await CallLiteResource(allCalls);

  // Send the response
  res.send({ status: true, message: "calls obtained", data: callsRes });
};

export const WebhookSynthflow = async (req, res) => {
  // console.log("Request headers:", req.headers);
  // console.log("Request body:", req.body);
  // console.log("Request raw data:", req);

  let data = req.body;
  console.log("Webhook data is ", data);

  let dataString = JSON.stringify(data);

  let callId = data.call.call_id;
  let status = data.call.status;
  let duration = data.call.duration;
  let transcript = data.call.transcript;
  let recordingUrl = data.call.recording_url;

  let dbCall = await db.CallModel.findOne({
    where: {
      callId: callId,
    },
  });
  if (!dbCall) {
    return res.send({
      status: true,
      message: "Webhook received. No such call exists",
    });
  }

  //Get Transcript and save
  let caller = await db.User.findByPk(dbCall.userId);
  let model = await db.User.findByPk(dbCall.modelId);
  let assistant = await db.Assistant.findOne({
    where: {
      userId: dbCall.modelId,
    },
  });

  if (data && data.lead) {
    data.lead.email = caller.email;
  }

  //only generate summary if the call status is empty or null otherwise don't
  console.log(`DB Call status${dbCall.status}`);
  if (dbCall.status == "" || dbCall.status == null) {
    dbCall.status = status;
    dbCall.duration = duration;
    dbCall.transcript = transcript;
    dbCall.recordingUrl = recordingUrl;
    dbCall.callData = dataString;
    let saved = await dbCall.save();
    let charged = await chargeUser(caller, dbCall, assistant);
    //(dbCall.transcript != "" && dbCall.transcript != null) {
    let previousSummaryRow = await db.UserCallSummary.findOne({
      where: {
        userId: caller.id,
        modelId: model.id,
      },
    });

    let prevSummary = "";
    if (previousSummaryRow) {
      prevSummary = previousSummaryRow.summary;
    }
    const gptSummary = await generateGptSummary(
      dbCall.transcript,
      model,
      caller,
      prevSummary
    );
    dbCall.summary = gptSummary.summary;
    data.summary = gptSummary.summary;
    dbCall.promptTokens = gptSummary.prompt_tokens;
    dbCall.completionTokens = gptSummary.completion_tokens;
    dbCall.totalCost = gptSummary.total_cost;
    let updatedSummaryForCall = await dbCall.save();
    // Save the summary in the UserCallSummary table
    if (previousSummaryRow) {
      previousSummaryRow.summary = gptSummary.summary;
      let saved = await previousSummaryRow.save();
      console.log("Summary for call updated", dbCall.callId);
    } else {
      await db.UserCallSummary.create({
        name: `Summary for Call ${callId}`,
        userId: dbCall.userId, // Assuming userId is part of dbCall
        modelId: dbCall.modelId, // Assuming modelId is part of dbCall
        summary: gptSummary.summary, // Assuming you've added this column to the model
      });
    }

    console.log("Assistant is ", assistant);
    //send the data to ghl here only once

    let webhook =
      "https://services.leadconnectorhq.com/hooks/ZzSCCR0w9ExkwP1fHpqh/webhook-trigger/88c7822d-7de9-434e-bad5-eaa65c394e1b";
    if (assistant.webook != "" && assistant.webook != null) {
      console.log("Assistant has a webhook");
      webhook = assistant.webook;
    }

    console.log("Sending TO GHL", webhook);
    console.log("Data sending to GHL:", data);
    try {
      const ghlResponse = await axios.post(webhook, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6IlVvSVlheDZaRjBQOURzNnhhNm1DIiwidmVyc2lvbiI6MSwiaWF0IjoxNzI1MzA4NzU1NjI3LCJzdWIiOiJaT3RBV2VQUGFnTzgzY2NvT0swNyJ9.o-PckxoKRwm8nJk712tho__n1MczZ8B1of-lihdt7p4`, // Add any necessary headers
        },
      });
      console.log("Data sent to GHL:", dbCall.callId);
    } catch (error) {
      console.error("Error sending data to GHL:", error);
      return res
        .status(500)
        .send({ status: false, message: "Failed to send data to GHL" });
    }
  } else {
    console.log("Alread obtained all data");
    dbCall.status = status;
    dbCall.duration = duration;
    dbCall.transcript = transcript;
    dbCall.recordingUrl = recordingUrl;
    dbCall.callData = dataString;
    let saved = await dbCall.save();
  }

  //process the data here
  return res.send({ status: true, message: "Webhook received" });
};

async function chargeUserTopup(caller, dbCall, assistant) {
  //update the user minutes available and charge if needed
  console.log("Charging user start");
  let amount = 1000; // update this to user's amount he charges (10 / 60) * duration * 100; //10 / 60 => amount per second & then x 100 to convert to cents
  let duration = dbCall.duration;
  // let user = caller
  if (caller && !assistant.allowTrial) {
    // if caller exists and the assistant/model does not allow trial then charge the user
    console.log("Assistant No Trial Allowed");
    if (caller.seconds_available - duration < 120) {
      console.log("Minutes below 2");
      //charge user

      // if (user) {
      //We are using hardcoded amount of $1 for now. A minute is worth $1. So we will add 10 minutes for now
      //to the user's call time

      let charge = await ChargeCustomer(
        amount,
        caller,
        "Recharged 10 minutes",
        "Charge for 10 minutes. Balance dropped below 2 minutes."
      );
      console.log("Charge is ", charge);
      dbCall.paymentStatus = charge.reason;
      if (charge.payment) {
        dbCall.paymentId = charge.payment.id;
        dbCall.paymentAmount = charge.payment.amount;
        caller.seconds_available = caller.seconds_available + 600;
      }
      dbCall.chargeDescription = charge.message;

      let saved = await dbCall.save();

      let userSaved = await caller.save();
      //console.log("User call time updated ", user.seconds_available);
      // } else {
      //   //console.log("No user to charge");
      // }
    } else {
      caller.seconds_available = caller.seconds_available - duration;
      let saved = await caller.save();
      //console.log("User call time updated ", user.seconds_available);
    }
  } else {
    //console.log("No user to charge");
  }
  // dbCall.paymentStatus = "Succeeded";
  let callSaved = await dbCall.save();
  console.log("Charging user Complete with status = ", dbCall.paymentStatus);
  return true;
}

//Based on Duration
async function chargeUser(caller, dbCall, assistant) {
  let ai = await db.UserAi.findOne({ where: { userId: assistant.userId } });
  if (ai.isFree) {
    dbCall.paymentStatus = "Free";
    await dbCall.save();
    return false;
  }
  let pricePerMin = Number(ai.price) || 0;

  if (pricePerMin == 0) {
    return false;
  }

  //update the user minutes available and charge if needed
  console.log("Charging user start");

  let duration = dbCall.duration;
  let amount = (duration * pricePerMin) / 60; // update this to user's amount he charges (10 / 60) * duration * 100; //10 / 60 => amount per second & then x 100 to convert to cents

  console.log("Amount to be charged ", amount);
  // let user = caller
  if (caller && !assistant.allowTrial) {
    // if caller exists and the assistant/model does not allow trial then charge the user
    console.log("Assistant: No Trial Allowed");
    if (caller.seconds_available - duration < 1) {
      console.log("Seconds below 1 so no free min remaining");
      //charge user

      // if (user) {
      //We are using hardcoded amount of $1 for now. A minute is worth $1. So we will add 10 minutes for now
      //to the user's call time

      let charge = await ChargeCustomer(
        amount,
        caller,
        `Call Charged ${dbCall.callId}`,
        `Charge for ${duration} seconds.`
      );
      console.log("Charge is ", charge);
      dbCall.paymentStatus = charge.reason;
      if (charge && charge.payment) {
        dbCall.paymentId = charge.payment.id;
        dbCall.paymentAmount = charge.payment.amount; // cents
        dbCall.paymentStatus = charge.reason;
        // caller.seconds_available = caller.seconds_available + 600;
      } else {
        dbCall.paymentStatus = "error";
      }
      dbCall.chargeDescription = charge.message;

      let saved = await dbCall.save();

      let userSaved = await caller.save();
      //console.log("User call time updated ", user.seconds_available);
      // } else {
      //   //console.log("No user to charge");
      // }
    } else {
      caller.seconds_available = caller.seconds_available - duration;
      let saved = await caller.save();
      //console.log("User call time updated ", user.seconds_available);
    }
  } else {
    //console.log("No user to charge");
  }
  // dbCall.paymentStatus = "Succeeded";
  let callSaved = await dbCall.save();
  console.log("Charging user Complete with status = ", dbCall.paymentStatus);
  return true;
}

const generateGptSummary = async (
  transcript,
  model,
  caller,
  prevSummary = ""
) => {
  try {
    // const openaiClient = new openai.OpenAIApi({
    //   apiKey: process.env.AIKey, // Make sure your API key is set in environment variables
    // });

    let callPromptText = constants.CallSummaryPrompt;
    callPromptText = callPromptText.replace("{model_name}", model.name);
    callPromptText = callPromptText.replace("{caller_name}", caller.name);
    callPromptText = callPromptText.replace("{transcript}", transcript);
    callPromptText = callPromptText.replace("{prevSummary}", prevSummary);
    const prompt = {
      content: callPromptText,
      role: "system",
    };

    const data = {
      model: "gpt-4o",
      temperature: 0.2,
      messages: [prompt],
      // max_tokens: 1000,
    };
    // setMessages(old => [...old, {message: "Loading....", from: "gpt", id: 0, type: MessageType.Loading}])
    const result = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      data,
      {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.AIKey}`,
        },
        timeout: 240000, // Timeout in milliseconds (4 minutes)
      }
    );

    const summary = result.data.choices[0].message.content.trim();

    let tokens = result.data.usage.total_tokens;
    let prompt_tokens = result.data.usage.prompt_tokens;
    let completion_tokens = result.data.usage.completion_tokens;

    let inputCostPerToken = 10 / 1000000;
    let outoutCostPerToken = 30 / 1000000;

    let inputCost = inputCostPerToken * prompt_tokens;
    let outputCost = outoutCostPerToken * completion_tokens;

    let totalCost = inputCost + outputCost;
    //console.log("Total cost this request", totalCost);
    return {
      tokens: tokens,
      completion_tokens: completion_tokens,
      prompt_tokens: prompt_tokens,
      total_cost: totalCost,
      summary: summary,
    };
    //console.log("GPT summary generated:", summary);
    // return summary;
  } catch (error) {
    console.error("Error generating GPT summary:", error);
    return "Summary not available";
  }
};
