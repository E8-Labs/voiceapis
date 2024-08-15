import nodeCron from "node-cron";
import db from "./src/models/index.js";
import { GetACall } from "./src/controllers/call.controller.js";
import { ChargeCustomer } from "./src/services/stripe.js";

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
        let amount = (10 / 60) * duration * 100; //10 / 60 => amount per second & then x 100 to convert to cents

        let user = await db.User.findOne({
          where: {
            phone: call.phone,
          },
        });
        if (user) {
          let charge = await ChargeCustomer(amount, user);
          console.log("Charge is ", charge);
          call.paymentStatus = charge.reason;
          if(charge.payment){
            call.paymentId = charge.payment.id;
            call.paymentAmount = charge.payment.amount;
          }
          call.chargeDescription = charge.message;
          
          let saved = await call.save();
        } else {
          console.log("No user to charge");
        }
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

const jobCharges = nodeCron.schedule(
  "*/1 * * * *",
  getCompletedCallsNotCharged
);
jobCharges.start();
