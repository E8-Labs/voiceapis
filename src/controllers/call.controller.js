import axios from 'axios';
import db from '../models/index.js';


// export const MakeACall = async(req, res) => {

//     res.send({status: true, message: "call is initiated", data: {someData: "This is some data here"}})
// }


async function PushDataToGhl(firstName, lastName, email, phone, callId) {
  let data = JSON.stringify({
    "email": email,
    "phone": phone,
    "firstName": firstName,
    "lastName": lastName,
    "name": `${firstName} ${lastName}`,
    "source": "public api",
    "customField": {
        "__custom_field_call_id__": callId
    }
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://rest.gohighlevel.com/v1/contacts/',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6IjVrWW5kcjhMTlBuRnpZcmwzZ0pPIiwidmVyc2lvbiI6MSwiaWF0IjoxNzIzNDQ1NTIwMjgyLCJzdWIiOiJaT3RBV2VQUGFnTzgzY2NvT0swNyJ9.sUzwtXp7HaS1G3tkEQGfjFU22nl8Y5RSt25QFNjpb6w'
    },
    data: data
  };

  try {
    const response = await axios.request(config);
    console.log("Data from ghl")
    console.log(JSON.stringify(response.data));
    return true;
  } catch (error) {
    console.log("Error from ghl")
    console.log(error);
    return false;
  }
}

export const MakeACall = async (req, res) => {
  // setLoading(true);
  let PhoneNumber = req.body.phone;
  let Name = req.body.name;
  let LastName = req.body.lastName;
  let Email = req.body.email
  try {


    let basePrompt = ""
    //find if any previous calls exist
    let calls = await db.CallModel.findAll({
      where: {
        phone: PhoneNumber
      }
    });
    console.log(`Calls for phone ${PhoneNumber} `, calls.length);
    for (let i = 0; i < calls.length; i++) {
      let call = calls[i]
      basePrompt = `${basePrompt}\n${call.transcript}`
    }

    //   const axios = require('axios');
    // console.log("Base Prompt is  ", basePrompt)
    let data = JSON.stringify({
      "name": Name,
      "phone": PhoneNumber,
      "model": "1716230980845x885692917254193200",
      prompt: basePrompt
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://fine-tuner.ai/api/1.1/wf/v2_voice_agent_call',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 1716566901317x213622515056508930'
      },
      data: data
    };

    axios.request(config)
      .then(async (response) => {
        let json = response.data
        console.log(json);
        if (json.status === "ok" || json.status === "success") {
          let callId = json.response.call_id;
          let savedToGhl = await PushDataToGhl(Name, LastName, Email, PhoneNumber, callId)
          let saved = await db.CallModel.create({
            callId: callId,
            phone: PhoneNumber,
            transcript: "",
            summary: "",
            duration: '',
            status: '',

          })
          console.log("Saved ", saved)
          res.send({ status: true, message: "call is initiated ", data: json })
        }
        else {
          res.send({ status: false, message: "call is not initiated", data: json })
        }

      })
      .catch((error) => {
        console.log(error);
        res.send({ status: false, message: "call is not initiated", data: null })
      });
  } catch (error) {
    console.error('Error occured is :', error);
    res.send({ status: false, message: "call is not initiated", data: null })
  }
}


export const GetACall = async (callId) => {
  //    let callId = req.query.callId
  try {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://fine-tuner.ai/api/1.1/wf/v2_voice_agent_transcript?call_id=${callId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 1716566901317x213622515056508930'
      }
    };

    let response = await axios.request(config)
    // .then(async (response) => {

    // console.log(response);
    if (response.status == 200) {
      let json = response.data
      console.log("Call data success")
      let data = json[0]
      // console.log("Call data is ", data);
      let dbCall = await db.CallModel.findOne({
        where: {
          callId: callId
        }
      })
      if (dbCall && (dbCall.status === "" || dbCall.status == null
        || dbCall.status == "in-progress" || dbCall.status == "initiated" || dbCall.status == "pending")) {
        console.log("Updating call in db");
        dbCall.transcript = data.transcript;
        dbCall.status = data.status;
        dbCall.duration = data.duration;
        let updated = await dbCall.save();
        console.log("Db call updated")
      }
      return { status: true, message: "call obtained", data: dbCall }
      res.send({ status: true, message: "call obtained", data: dbCall })
    }
    else {
      console.log("Call not obtained ", response)
      return { status: false, message: "call not obtained", data: response }
      res.send({ status: false, message: "call not obtained", data: response })
    }

    // })
    // .catch((error) => {
    //   console.log(error);
    //   return {status: false, message: "call not obtained", data: null}
    //   res.send({status: false, message: "call not obtained", data: null})
    // });
  } catch (error) {
    console.error('Error occured is :', error);
    return { status: false, message: "Call data error", error: error }
    res.send({ status: false, message: "call not obtained", data: null })
  }
}