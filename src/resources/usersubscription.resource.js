import db from "../models/index.js";
import { RetrieveASubscriptions } from "../services/stripe.js";


const Op = db.Sequelize.Op;

const UserSubscriptionResource = async (plan) => {
    return await getUserData(plan);
}

async function getUserData(p) {
////console.log("Finding subs for " , p)
let sub = await RetrieveASubscriptions(p.subid || p.id);
if(!sub){
    ////console.log("No subs for ", p.subid || p.id)
return null;
}
    
    if ((sub.livemode && process.env.Environment === "Production") || (!sub.livemode && process.env.Environment === "Sandbox")) {
        
        return extractSubscriptionDetails(sub); //
    }
    else {
        return null
    }
}


const extractSubscriptionDetails = (subscription) => {
    // Extract status
    const status = subscription.status;
  
    // Extract expiryDate or renewalDate
    let expiryDate;
    if (status === "canceled" && subscription.cancel_at_period_end) {
      expiryDate = new Date(subscription.cancel_at * 1000).toLocaleDateString('en-US');
    } else {
      expiryDate = new Date(subscription.current_period_end * 1000).toLocaleDateString('en-US');
    }
  
    // Extract priceId and plan
    const priceId = subscription.items.data[0].price.id;
    let plan;
    if (priceId === "price_1Ps1D6JlIaVux60FgJlUK55j") {
      plan = "yearly";
    } else if (priceId === "price_1Ps1G3JlIaVux60FW8ouEjlx") {
      plan = "monthly";
    }
  
    // Extract price of the plan
    const price = subscription.items.data[0].price.unit_amount / 100;
  
    // Extract cancelsAtPeriodEnd
    const cancelsAtPeriodEnd = subscription.cancel_at_period_end;
  
    // Calculate remaining days of trial if applicable
    let remainingDays;
    let trialEndDate;
    if (subscription.status === "trialing") {
      const currentDate = Math.floor(Date.now() / 1000);
      trialEndDate = new Date(subscription.trial_end * 1000).toLocaleDateString('en-US');
      remainingDays = Math.ceil((subscription.trial_end - currentDate) / (60 * 60 * 24));
    }
  
    return {
      status,
      expiryDate,
      priceId,
      plan,
      price,
      cancelsAtPeriodEnd,
      remainingDays,
      trialEndDate
    };
  };
  

export default UserSubscriptionResource;