import db from "../models/index.js";
import AssistantResource from "./assistantresource.js";
import UserProfileFullResource from "./userprofilefullresource.js";

const Op = db.Sequelize.Op;

const CallLiteResource = async (user, currentUser = null) => {
    if (!Array.isArray(user)) {
        //////console.log("Not array")
        return await getUserData(user, currentUser);
    }
    else {
        //////console.log("Is array")
        const data = []
        for (let i = 0; i < user.length; i++) {
            const p = await getUserData(user[i], currentUser)
            //////console.log("Adding to index " + i)
            data.push(p);
        }

        return data;
    }
}

async function getUserData(call, currentUser = null) {

    //caller can be identified with the phone number in the call object
    let caller = await db.User.findOne({
        where:{
            id: call.userId
        }
    })
    let callRes = null
    if(caller){
        callRes = await UserProfileFullResource(caller)
    }

    //userId in the call object is of the assistant owner with whom we are calling 
    let model = await db.Assistant.findOne({
        where: {
            userId: call.modelId
        }
    })
    let chargeAmountForModel = 1;
    let ai = await db.UserAi.findOne({
        where:{
            userId: call.modelId
        }
    })
    if(ai){
        chargeAmountForModel = Number(ai.price) || 1;
    }

    let totalChargeForCall = chargeAmountForModel * call.duration / 60;

    let min = Math.floor(call.duration / 60) || 0;
      if (min < 1) {
        min = 0;
      }
      let secs = call.duration % 60 || 0;
      let durationString = `${min < 10 ? `0${min}` : min}:${
        secs < 10 ? `0${secs}` : secs
      }`;



    let modelRes = null
    let message = ""
    if(model){
        modelRes = await AssistantResource(model)
        message = `on call with ${caller.name.split(" ")[0]}`
        if(model.userId){
            let modelOwner = await db.User.findByPk(model.userId)
            if(modelOwner.name){
                message = `on call with ${caller.name.split(" ")[0]}`
            }
            else if(modelOwner.username){
                message = `on call with ${caller.username.split(" ")[0]}`
            }
        }
    }

    
    const UserFullResource = {
        id: call.id,
        callId: call.callId,
        createdAt: call.createdAt,
        updatedAt: call.updatedAt,
        caller: callRes,
        model: modelRes,
        message: message,
        amount: totalChargeForCall,
        durationString: durationString,
        durationInSec: call.duration
    }


    return UserFullResource;
}

export default CallLiteResource;