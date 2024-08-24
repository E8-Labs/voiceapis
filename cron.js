import nodeCron from "node-cron";
import db from "./src/models/index.js";
import { GetACall } from "./src/controllers/call.controller.js";
import { ChargeCustomer } from "./src/services/stripe.js";

async function rechargeUsersAccounts() {
  let users = await db.User.findAll({
    where: {
      seconds_available: {
        [db.Sequelize.lte]: 120,
      },
    },
  });
  console.log(`${users.length} Users have less than 2 minutes`)

  if (users && users.length > 0) {
    for (let i = 0; i < users.length; i++) {
      let u = users[i];
      let amount = 1000;
      console.log(`User ${u.email} has balance `, user.seconds_available)
      let charge = await ChargeCustomer(amount, u);
      console.log("Charged in user is ", charge);
      call.paymentStatus = charge.reason;
      if (charge.payment) {
        call.paymentId = charge.payment.id;
        call.paymentAmount = charge.payment.amount;
      }
      call.chargeDescription = charge.message;

      let saved = await call.save();
      u.seconds_available = u.seconds_available + 600;
      let userSaved = await u.save();
      console.log("User call time updated in user", u.seconds_available);
    }
  }
}

async function getCompletedCallsNotCharged() {
  console.log("Running cron job Completed Calls");
  try {
    let calls = await db.CallModel.findAll({
      where: {
        status: "completed",
        paymentStatus: {
          [db.Sequelize.Op.ne]: "succeeded",
        },
      },
    });
    console.log("Calls pending cahrge found: ", calls.length);
    //getCompletedCallsNotCharged
    if (calls && calls.length > 0) {
      for (let i = 0; i < calls.length; i++) {
        let call = calls[i];
        let callId = call.callId;
        console.log("Getting call id ", callId);

        let duration = call.duration; //in seconds
        let amount = 1000; //(10 / 60) * duration * 100; //10 / 60 => amount per second & then x 100 to convert to cents

        let user = await db.User.findOne({
          where: {
            phone: call.phone,
          },
        });
        if (user) {
          if (user.seconds_available - duration < 120) {
            //charge user

            // if (user) {
            //We are using hardcoded amount of $10 for now. A minite is worth $1. So we will add 10 minutes for now
            //to the user's call time
            let charge = await ChargeCustomer(amount, user);
            console.log("Charge is ", charge);
            call.paymentStatus = charge.reason;
            if (charge.payment) {
              call.paymentId = charge.payment.id;
              call.paymentAmount = charge.payment.amount;
            }
            call.chargeDescription = charge.message;

            let saved = await call.save();
            user.seconds_available = user.seconds_available + 600;
            let userSaved = await user.save();
            console.log("User call time updated ", user.seconds_available);
            // } else {
            //   console.log("No user to charge");
            // }
          } else {
            user.seconds_available = user.seconds_available - duration;
            let saved = await user.save();
            console.log("User call time updated ", user.seconds_available);
          }
        } else {
          console.log("No user to charge");
        }
        call.paymentStatus = "Succeeded";
        let callSaved = await call.save();
      }
    }
  } catch (error) {
    console.log("Error ", error);
  }
}

async function getCallsAndDetails() {
  console.log("Running cron job");
  try {
    let calls = await db.CallModel.findAll({
      where: {
        status: {
          [db.Sequelize.Op.notIn]: [
            "completed",
            "failed",
            "hangup_on_voicemail",
            "no-answer",
          ],
        },
        createdAt: {
          [db.Sequelize.Op.gte]: new Date(new Date() - 60 * 60 * 1000), // Fetch calls created in the last 60 minutes
        },
      },
    });
    console.log("Calls found: ", calls.length);

    if (calls && calls.length > 0) {
      console.log("Pending calls found");
      for (let i = 0; i < calls.length; i++) {
        let callId = calls[i].callId;
        console.log("Getting call id ", callId);

        try {
          let data = await GetACall(callId);
          // console.log("Call fetched and updated: ", data);
        } catch (error) {
          console.error(`Error fetching call with id ${callId}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching calls:", error);
  }
}
const job = nodeCron.schedule("*/1 * * * *", getCallsAndDetails);
job.start();

// const jobCharges = nodeCron.schedule(
//   "*/1 * * * *",
//   getCompletedCallsNotCharged
// );
// jobCharges.start();


const jobUserTopup = nodeCron.schedule(
  "*/1 * * * *",
  rechargeUsersAccounts
);
jobUserTopup.start()