import axios from "axios";
import db from "../models/index.js";
import { loadCards } from "../services/stripe.js";
import CallLiteResource from "../resources/callliteresource.js";
import OpenAI from "openai";

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
      let cards = await loadCards(user);
      if (cards && cards.length > 0) {
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

  //console.log("Calling assistant", assistant.name);
  //console.log("Model ", assistant.modelId);
  try {
    let basePrompt = assistant.prompt;
    //find if any previous calls exist
    let calls = await db.CallModel.findAll({
      where: {
        phone: PhoneNumber,
      },
    });
    //console.log(`Calls for phone ${PhoneNumber} `, calls.length);
    for (let i = 0; i < calls.length; i++) {
      let call = calls[i];
      basePrompt = `${basePrompt}\n${call.transcript}`;
    }

    //   const axios = require('axios');
    // //console.log("Base Prompt is  ", basePrompt)
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
        //console.log(json);
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
          //console.log("Saved ", saved);
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
        //console.log(error);
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

        if (dbCall.transcript != "" || dbCall.transcript != null) {
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
            //console.log("Summary for call updated");
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
            [db.Sequelize.Op.between]: [17, 36],
          },
        },
      ],
    },
    order: [["createdAt", "DESC"]],
    limit: 20,
  });

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
  //console.log('Actual Calls ', callsActual )

  // Combine the calls and filter for unique calls based on callerId and callId
  let uniqueCallers = new Set();
  let uniqueCalls = new Set();
  let allCalls = [...calls, ...callsActual].filter(call => {
    if (!uniqueCallers.has(call.userId) && !uniqueCalls.has(call.id)) {
      uniqueCallers.add(call.userId);
      uniqueCalls.add(call.id);
      return true;
    }
    return false;
  });

  // Get the call resource data
  let callsRes = await CallLiteResource(allCalls);

  // Send the response
  res.send({ status: true, message: "calls obtained", data: callsRes });
};


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
    //console.log("GPT summary generated:", summary);
    return summary;
  } catch (error) {
    console.error("Error generating GPT summary:", error);
    return "Summary not available";
  }
};
