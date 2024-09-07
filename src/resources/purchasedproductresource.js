import db from "../models/index.js";
import AssistantResource from "./assistantresource.js";
import UserProfileFullResource from "./userprofilefullresource.js";
import UserProfileLiteResource from "./userprofileliteresource.js";

const Op = db.Sequelize.Op;

const PurchasedProductResource = async (user, currentUser = null) => {
  if (!Array.isArray(user)) {
    //////console.log("Not array")
    return await getUserData(user, currentUser);
  } else {
    //////console.log("Is array")
    const data = [];
    for (let i = 0; i < user.length; i++) {
      const p = await getUserData(user[i], currentUser);
      //////console.log("Adding to index " + i)
      data.push(p);
    }

    return data;
  }
};

async function getUserData(product, currentUser = null) {
  //caller can be identified with the phone number in the call object

  let p = await db.SellingProducts.findByPk(product.productId);
  let owner = await db.User.findByPk(p.userId);
  let productOwnerRes = await UserProfileLiteResource(owner);
  const UserFullResource = {
    id: p.id,
    name: p.name,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    productPrice: p.productPrice,
    user: productOwnerRes,
    stripeProductId: p.stripeProductId,
    stripePriceId: p.stripePriceId,
    stripePaymentLink: p.stripePaymentLink,
  };

  return UserFullResource;
}

export default PurchasedProductResource;
