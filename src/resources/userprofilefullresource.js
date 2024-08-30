import db from "../models/index.js";
import AssistantLiteResource from "./assistantliteresource.js";
import UserSubscriptionResource from "./usersubscription.resource.js";

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

    let totalSeconds = await db.CallModel.sum("duration", {
        where: {
            modelId: user.id,
            status: "completed",
            // paymentStatus: "succeeded"
        }
    });
    let totalEarned = 0 // if the creator has free calls
    let amountToChargePerMin = 10;// Dollars
    let ai = await db.UserAi.findOne({
        where:{
            userId: user.id
        }
    })
    if(ai){
        console.log("An AI Found for user ", ai)
        amountToChargePerMin = ai.price
    }
    else{
        amountToChargePerMin = 10; // by default 10
    }
    console.log(`User ${user.id} charges ${amountToChargePerMin}/min`)
    totalEarned = (totalSeconds - 300) * amountToChargePerMin / 60;
    console.log(`TotalSeconds for ${user.id}`, totalSeconds)
    let totalCalls = await db.CallModel.count({
        where: {
            modelId: user.id,
            status: "completed",
            // paymentStatus: "succeeded"
        }
    });
    console.log(`TotalCalls for ${user.id}`, totalCalls)

    let sub = await db.SubscriptionModel.findOne({
        where: {
            userId: user.id,
            environment: process.env.Environment
        },
        order: [
            ["createdAt", "DESC"]
        ]
    })
    let plan = null
    if (sub) {
        plan = await UserSubscriptionResource(sub)
    }

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
        earned: totalEarned,
        plan: plan
    }


    return UserFullResource;
}

export default UserProfileFullResource;