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
    let modelRes = null
    let message = ""
    if(model){
        modelRes = await AssistantResource(model)
        message = `on call with ${caller.name}`
        if(model.userId){
            let modelOwner = await db.User.findByPk(model.userId)
            if(modelOwner.name){
                message = `on call with ${caller.name}`
            }
            else if(modelOwner.username){
                message = `on call with ${caller.username}`
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
        message: message
    }


    return UserFullResource;
}

export default CallLiteResource;