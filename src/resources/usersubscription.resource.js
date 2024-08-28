import db from "../models/index.js";
import { RetrieveASubscriptions } from "../services/stripe.js";


const Op = db.Sequelize.Op;

const UserSubscriptionResource = async (plan) => {
    return await getUserData(plan);
}

async function getUserData(p) {
//console.log("Finding subs for " , p)
let sub = await RetrieveASubscriptions(p.subid || p.id);
if(!sub){
    //console.log("No subs for ", p.subid || p.id)
return null;
}
    // const cancelAtPeriodEnd = sub.cancel_at_period_end;

    // // Get the current period end date
    // const currentPeriodEnd = sub.current_period_end;

    // // Calculate remaining days
    // const currentDate = Math.floor(Date.now() / 1000); // Current date in seconds
    // const remainingDays = Math.ceil((currentPeriodEnd - currentDate) / (60 * 60 * 24)); // Convert seconds to days
    // // //console.log("User have subscription plan", sub)
    // sub.remainingDays = remainingDays;
    // if (cancelAtPeriodEnd) {
    //     //console.log(`Subscription will end at the end of the current period. Remaining days: ${remainingDays}`);
    // } else {
    //     //console.log('Subscription is active and set to auto-renew.');
    // }
    // sub.remainingDays = remainingDays;
    // sub.trialStatus = sub.status === "trialing" ? "trialing" : "none"
    //console.log("Environment is ", process.env.Environment)
    if ((sub.livemode && process.env.Environment === "Production") || (!sub.livemode && process.env.Environment === "Sandbox")) {
        // if(sub.status === "trialing"){
        //     sub.status = "active"
        // }
        return extractSubscriptionDetails(sub); //
    }
    else {
        return null
    }







    // return plan;
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
  
  // Example usage
//   const subscription = {
//     // Your subscription object goes here
//   };
  
//   const details = extractSubscriptionDetails(subscription);
//   console.log(details);
  


export default UserSubscriptionResource;