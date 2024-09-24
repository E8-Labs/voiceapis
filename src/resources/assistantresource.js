import db from "../models/index.js";
import UserProfileFullResource from "./userprofilefullresource.js";

const Op = db.Sequelize.Op;

//This is Assistant Resource
const AssistantResource = async (user, currentUser = null) => {
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

    
    let ownerRes = null
    if(user.userId){
        let owner = await db.User.findOne({
            where:{
                id: user.userId
            }
        })
        ownerRes = await UserProfileFullResource(owner)
    }

    

    

    const UserFullResource = {
        id: user.id,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        owner: ownerRes,
        // assistant: model,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }


    return UserFullResource;
}

export default AssistantResource;