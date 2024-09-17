import db from "../models/index.js";
import AssistantLiteResource from "./assistantliteresource.js";
import UserSubscriptionResource from "./usersubscription.resource.js";

const Op = db.Sequelize.Op;

const UserProfileFullResource = async (user, currentUser = null) => {
  if (!Array.isArray(user)) {
    ////////console.log("Not array")
    return await getUserData(user, currentUser);
  } else {
    ////////console.log("Is array")
    const data = [];
    for (let i = 0; i < user.length; i++) {
      const p = await getUserData(user[i], currentUser);
      ////////console.log("Adding to index " + i)
      data.push(p);
    }

    return data;
  }
};

async function getUserData(user, currentUser = null) {
  let assistant = await db.Assistant.findOne({
    where: {
      userId: user.id,
    },
  });

  let totalSeconds = await db.CallModel.sum("duration", {
    where: {
      modelId: user.id,
      status: {
        [db.Sequelize.Op.in]: ["completed", "hangup_on_voicemail"],
      },
      // paymentStatus: "succeeded"
    },
  });
  let totalEarned = 0; // if the creator has free calls
  let amountToChargePerMin = 10; // Dollars
  let ai = await db.UserAi.findOne({
    where: {
      userId: user.id,
    },
  });
  if (ai) {
    //console.log("An AI Found for user ", ai);
    amountToChargePerMin = ai.price;
  } else {
    amountToChargePerMin = 10; // by default 10
  }
  //console.log(`User ${user.id} charges ${amountToChargePerMin}/min`);
  totalEarned = ((totalSeconds - 300) * amountToChargePerMin) / 60;

  //console.log('MyCalculation', totalEarned)

  // totalEarned = await calculateTotalEarned(user.id)
  let earningData = await calculateEarningsForCreator(user.id)
  console.log("Total earned ", earningData)
  totalEarned = earningData.totalEarned;
  //console.log('GPTCalculation', totalEarned)
  //console.log(`TotalSeconds for ${user.id}`, totalSeconds);
  let totalCalls = await db.CallModel.count({
    where: {
      modelId: user.id,
      status: "completed",
      // paymentStatus: "succeeded"
    },
  });
  //console.log(`TotalCalls for ${user.id}`, totalCalls);

  let sub = await db.SubscriptionModel.findOne({
    where: {
      userId: user.id,
      environment: process.env.Environment,
    },
    order: [["createdAt", "DESC"]],
  });
  let plan = null;
  if (sub) {
    plan = await UserSubscriptionResource(sub);
  }

  const UserFullResource = {
    id: user.id,
    name: user.name,
    profile_image: user.profile_image,
    full_profile_image: user.full_profile_image,
    email: user.email,
    phone: user.phone,
    city: user.city,
    state: user.state,
    role: user.role,
    assitant: assistant ? await AssistantLiteResource(assistant) : null,
    calls: totalCalls,
    earned: totalEarned,
    plan: plan,
  };

  return UserFullResource;
}


const calculateEarningsForCreator = async (modelId) => {
  try {
    // Fetch all calls for the given creator (modelId)
    const callsForCreator = await db.CallModel.findAll({
      where: { modelId },
      include: [
        { model: db.User, as: 'caller', attributes: ['id', 'name'] }, // Assuming 'caller' alias refers to the user who called
      ],
    });

    // Initialize variables to store total call minutes and earnings for the creator
    let totalMinutesForCreator = 0;
    let totalEarningsForCreator = 0;

    // Array to store calls that were not charged
    let nonChargedCalls = [];

    // Store total minutes used by each user across all models
    const userMinutesMap = {};

    // Fetch the rate per minute for the creator from UserAi
    const creatorAiData = await db.UserAi.findOne({ where: { userId: modelId } });
    const ratePerMinute = creatorAiData ? creatorAiData.price : 0;

    // Process each call and calculate minutes (convert seconds to minutes)
    for (let call of callsForCreator) {
      const { userId, duration, caller } = call;
      
      // Convert duration from seconds to minutes
      const minutes = parseFloat(duration) / 60;

      // Ensure that duration is a valid number
      if (isNaN(minutes) || minutes <= 0) {
        console.log(`Invalid duration for call with id ${call.id}: ${duration}`);
        continue; // Skip invalid or zero-duration calls
      }

      // Track total minutes used by the caller (userId) across all creators
      if (!userMinutesMap[userId]) {
        userMinutesMap[userId] = 0;
      }
      const previousTotalMinutesForUser = userMinutesMap[userId];
      userMinutesMap[userId] += minutes;

      // Calculate how many free minutes are left for this user
      const freeMinutesUsed = Math.min(5, previousTotalMinutesForUser);
      const remainingFreeMinutes = Math.max(5 - freeMinutesUsed, 0);

      // Calculate the paid minutes for this specific call
      const paidMinutesForThisCall = Math.max(minutes - remainingFreeMinutes, 0);

      // If the call wasn't charged (because it was within the free minutes), store its details
      if (paidMinutesForThisCall === 0) {
        nonChargedCalls.push({
          callerName: caller.name,
          callerId: caller.id,
          duration: minutes,
        });
      }

      // Add to the total for this creator
      totalMinutesForCreator += minutes;
      totalEarningsForCreator += paidMinutesForThisCall * ratePerMinute;
    }

    // Return the results in a JSON object
    return {
      totalMinutes: totalMinutesForCreator,
      totalEarned: totalEarningsForCreator,
      ratePerMinute,
      nonChargedCalls,  // Overview of calls that were not charged
    };
  } catch (error) {
    console.error('Error calculating earnings:', error);
    throw error;
  }
};





const calculateTotalEarned = async (modelId) => {
  try {
    let amountToChargePerMin = 10; // Dollars
    let ai = await db.UserAi.findOne({
      where: {
        userId: modelId,
      },
    });
    if (ai) {
      //console.log("An AI Found for user ", ai);
      amountToChargePerMin = ai.price;
    } else {
      amountToChargePerMin = 10; // by default 10
    }
    // Find all calls to the given creator (modelId)
    const calls = await db.CallModel.findAll({
      where: {
        modelId: modelId,
      },
      attributes: [
        "userId",
        [db.Sequelize.fn("SUM", db.Sequelize.col("duration")), "totalDuration"],
      ],
      group: ["userId"],
    });

    let totalEarned = 0;

    calls.forEach((call) => {
      const totalDurationInSeconds = parseInt(
        call.getDataValue("totalDuration"),
        10
      );
      const totalDurationInMinutes = totalDurationInSeconds / 60;
      console.log(`Duration for ${totalDurationInSeconds} sec in min ${totalDurationInMinutes}`)
      
      // Subtract 5 minutes free per user
      const billableMinutes =
        totalDurationInMinutes > 5 ? totalDurationInMinutes - 5 : 0;

      // Charge $1 per minute for billable minutes
      const earnedForUser = billableMinutes * amountToChargePerMin; // $1 per minute
      console.log(`TotalEarned ${call.userId}`, earnedForUser)
      totalEarned += earnedForUser;
    });

    return totalEarned;
  } catch (error) {
    console.error("Error calculating total earned: ", error);
    return 0;
  }
};

export default UserProfileFullResource;
