import axios from "axios";
import db from "../models/index.js";
import { loadCards } from "../services/stripe.js";
import CallLiteResource from "../resources/callliteresource.js";
import OpenAI from "openai";
import { ChargeCustomer } from "../services/stripe.js";

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
    return res.send({
      status: false,
      message: "No such assistant",
      data: null,
      reason: "no_such_assistant",
    });
  }

  let user = await db.User.findOne({
    where: {
      phone: PhoneNumber,
    },
  });

  if (user) {
    // user is in the database.

    //The below logic is discarded enclosed in #####
    //###########################################################################
    //check if he has pending previous transactions
    // let calls = await db.CallModel.findAll({
    //   where: {
    //     status: 'completed',
    //     paymentStatus: {
    //       [db.Sequelize.Op.ne]: "succeeded"
    //     },
    //     phone: {
    //       [db.Sequelize.Op.like]: `%${PhoneNumber}%`
    //     }
    //   }
    // });
    //###########################################################################

    if (user.seconds_available <= 120) {
      //
      let cards = await loadCards(user);
      //if the assistant allows trial then no need to block user from calling
      if ((cards && cards.length > 0) || assistant.allowTrial) {
        // we will think of the logic here.
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
    //find if any previous calls exist
    let calls = await db.CallModel.findAll({
      where: {
        phone: PhoneNumber,
      },
    });
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
          res.send({
            status: false,
            message: "call is not initiated",
            data: json,
          });
        }
      })
      .catch((error) => {
        console.log(error);
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

    let webhook = "https://services.leadconnectorhq.com/hooks/ZzSCCR0w9ExkwP1fHpqh/webhook-trigger/88c7822d-7de9-434e-bad5-eaa65c394e1b"
    if(assistant.webook != '' && assistant.webook != null){
      console.log("Assistant has a webhook")
      webhook = assistant.webook;
    }

    console.log('Sending TO GHL', webhook)
    
    try {
      const ghlResponse = await axios.post(
        webhook,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            // 'Authorization': `Bearer GHL_API_KEY`, // Add any necessary headers
          },
        }
      );
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

async function chargeUser(caller, dbCall, assistant) {
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

export const GenSummary = async (req, res) => {
  let transcript = `"bot: .
human:  Hello?
bot: Hey, what's up man? 
bot: Ready to dominate and become a top G? 
bot: Let's cut the bullshit—what do you want to conquer today? 
human:  Love that. I am trying to level up in my operation. I just
human:  launched an AI company and
human:  trying to just really, you know,
human:  take over the world.
bot: That's the spirit! 
bot: Taking over the world starts with a solid strategy. 
bot: What's your main focus right now—scaling your team, acquiring clients, or something else? 
human:  Bringing in more clientele and then, obviously,
bot: Got it. 
bot: To bring in more clients, you need a killer marketing strategy and relentless networking. 
bot: Are you leveraging social media, cold outreach, or partnerships to attract new clients? 
human:  No. Not the social media.
human:  No to those two. Just doing our own
human:  Cold calling.
bot: Cold calling can be powerful if done right. 
bot: Make sure your pitch is sharp and tailored to each prospect. 
bot: Have you considered adding email campaigns or attending industry events to expand your reach? 
human:  I really haven't been able to focus more on the business.
human:  Just got out of a five year relationship and
human:  kinda taking a toll on me.
bot: I get it, breakups can be brutal. 
bot: But you can't let it derail your mission. 
bot: Channel that energy into your business—use the pain as fuel to push harder and achieve more. 
bot: What's one immediate step you can take to refocus on your business? 
human:  I don't know. I don't think I have any immediate
human:  success. What do you think I should do to refocus on my business?
bot: Start by setting clear, actionable goals. 
bot: Break them down into daily tasks. 
bot: Focus on one thing at a time—whether it's refining your pitch, reaching out to new leads, or improving your product. 
bot: What's one small task you can tackle today to move the needle? 
human:  I don't know. What do you think I should focus on?
bot: Alright, let's start with refining your pitch. 
bot: A strong pitch can make all the difference in cold calling. -
human:  Why why refine MyPets to you?
human:  Think my pitch is bad?
bot: Not saying it's bad, but there's always room for improvement. 
bot: A sharper pitch can convert more leads into clients. 
bot: How about we go over your current pitch and see where it can be tightened up? 
human:  Sure. I think that might make the move right move.
human:  Do that.
bot: Great. 
bot: Let's hear your current pitch. 
bot: Give me the rundown of what you say to potential clients. 
human:  Hold on. My my actual calling me. Shall I answer this call or
human:  should I stay on with you?
bot: Take the call. 
bot: Handle your business, then come back and we'll refine that pitch. 
bot: I'll be here when you're ready. 
human:  But you were just telling me I need to focus on
human:  not to think about the breakup.
human:  Now you're telling me to take the call.
bot: You're right. 
bot: Let's stay focused on your business. 
bot: Forget the call and let's work on refining your pitch. 
bot: What's the main value proposition you offer to clients?"`;

  try {
    // const openaiClient = new openai.OpenAIApi({
    //   apiKey: process.env.AIKey, // Make sure your API key is set in environment variables
    // });
    const prompt = {
      content: `You'll be summarizing the transcript between Tate.AI and Noah.

1. Transcript Information:
* Utilize the new call transcript provided here: ${transcript}.
* Combine this with the existing call summary here: None

2. Comprehensive Summary Generation:
* Create a complete and cohesive summary that integrates both the new and previous call information.
* This summary should encompass all conversations held between Tate.AI and Noah, capturing the full scope of their interactions.

3. Key Details to Include:
* Ensure that names, personal stories, topics discussed, and any other pertinent details are thoroughly documented.
* Highlight any significant themes, decisions, or follow-up actions that may be relevant for future conversations.

4. Purpose and Usage:
* This summary will be used to house and reference all the different calls and conversations between Tate AI and Noah.
* It is crucial that the summary is detailed and comprehensive to support future interactions, allowing for seamless continuity in conversations.`,
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
    //console.log("GPT summary generated:", summary);
    return res.send({ status: true, data: summary });
  } catch (error) {
    console.error("Error generating GPT summary:", error);
    return res.send({ data: "Summary not available" });
  }
};

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
    const prompt = {
      content: `You'll be summarizing the transcript between ${model.name} AI and ${caller.name}.

1. Transcript Information:
* Utilize the new call transcript provided here: ${transcript}.
* Combine this with the existing call summary here: ${prevSummary}

2. Comprehensive Summary Generation:
* Create a complete and cohesive summary that integrates both the new and previous call information.
* This summary should encompass all conversations held between ${model.name} AI and ${caller.name}, capturing the full scope of their interactions.

3. Key Details to Include:
* Ensure that names, personal stories, topics discussed, and any other pertinent details are thoroughly documented.
* Highlight any significant themes, decisions, or follow-up actions that may be relevant for future conversations.

4. Purpose and Usage:
* This summary will be used to house and reference all the different calls and conversations between ${model.name} AI and ${caller.name}.
* It is crucial that the summary is detailed and comprehensive to support future interactions, allowing for seamless continuity in conversations.`,
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
