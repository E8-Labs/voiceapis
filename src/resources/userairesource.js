import db from "../models/index.js";
import UserProfileFullResource from "./userprofilefullresource.js";

const Op = db.Sequelize.Op;

//This is Assistant Resource
const UserAiResource = async (user, currentUser = null) => {
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

async function getUserData(ai, currentUser = null) {
  let ownerRes = null;
  if (ai.userId) {
    let owner = await db.User.findOne({
      where: {
        id: ai.userId,
      },
    });
    ownerRes = await UserProfileFullResource(owner);
  }

  let kycQuestions = await db.KycQuestions.findAll({
    where: {
      userId: ai.userId,
    },
  });

  const UserFullResource = {
    ...user,
    user: ownerRes,
    kycQuestions: kycQuestions,
  };

  return UserFullResource;
}

export default UserAiResource;
