import db from "../models/index.js";
import AssistantLiteResource from "./assistantliteresource.js";

const Op = db.Sequelize.Op;

const UserProfileFullResource = async (user, currentUser = null) => {
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

async function getUserData(user, currentUser = null) {

    let assistant = await db.Assistant.findOne({
        where:{
            userId: user.id
        }
    })

    let totalEarned = await db.CallModel.sum("paymentAmount", {
        where: {
            userId: user.id,
            status: "completed",
            paymentStatus: "succeeded"
        }
    });
    
    let totalCalls = await db.CallModel.count({
        where: {
            userId: user.id,
            status: "completed",
            paymentStatus: "succeeded"
        }
    });

    const UserFullResource = {
        id: user.id,
        name: user.name,
        profile_image: user.profile_image,
        full_profile_image: user.full_profile_image,
        email: user.email,
        phone: user.phone,
        role: user.role,
        assitant: assistant ? await AssistantLiteResource(assistant) : null,
        calls: totalCalls,
        earned: totalEarned / 100
    }


    return UserFullResource;
}

export default UserProfileFullResource;