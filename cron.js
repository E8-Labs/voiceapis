import nodeCron from 'node-cron'
import db from "./src/models/index.js";
import { GetACall } from './src/controllers/call.controller.js';


async function getCallsAndDetails() {
    console.log("Running cron job");
    try {
        let calls = await db.CallModel.findAll({
            where: {
                status: { 
                    [db.Sequelize.Op.notIn]: ["completed", "failed"] 
                 },
                 createdAt: {
                    [db.Sequelize.Op.gte]: new Date(new Date() - 60 * 60 * 1000) // Fetch calls created in the last 60 minutes
                }
            }
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
const job = nodeCron.schedule('*/1 * * * *', getCallsAndDetails)

job.start();