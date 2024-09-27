import db from "../models/index.js";
import UserProfileFullResource from "./userprofilefullresource.js";

const Op = db.Sequelize.Op;

//This is Assistant Resource
const AssistantLiteResource = async (user, currentUser = null) => {
    if (!Array.isArray(user)) {
        ////////console.log("Not array")
        return await getUserData(user, currentUser);
    }
    else {
        ////////console.log("Is array")
        const data = []
        for (let i = 0; i < user.length; i++) {
            const p = await getUserData(user[i], currentUser)
            ////////console.log("Adding to index " + i)
            data.push(p);
        }

        return data;
    }
}

async function getUserData(user, currentUser = null) {

    
    

    const UserFullResource = {
        id: user.id,
        name: user.name,
        userId: user.userId,
        modelId: user.modelId,
        apikey: user.apikey,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        prompt: user.prompt,
        allowTrial: user.allowTrial
    }


    return UserFullResource;
}

export default AssistantLiteResource;