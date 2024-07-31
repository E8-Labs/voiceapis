import 'module-alias/register.js';
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import nodeCron from 'node-cron'

import db from './src/models/index.js';

import callRouter from './src/routes/call.route.js';
import UserRouter from './src/routes/user.route.js';


dotenv.config();


const app = express()
app.use(cors())
app.use(express.json())



db.sequelize.sync({alter: true})

app.use("/api/calls", callRouter);
app.use("/api/user", UserRouter);






import { GetACall } from './src/controllers/call.controller.js';


async function getCallsAndDetails() {
    console.log("Running cron job");
    try {
        let calls = await db.CallModel.findAll({
            where: {
                status: { [db.Sequelize.Op.ne]: "completed" }
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
                    console.log("Call fetched and updated: ", data);
                } catch (error) {
                    console.error(`Error fetching call with id ${callId}:`, error);
                }
            }
        }
    } catch (error) {
        console.error("Error fetching calls:", error);
    }
}

// every two minutes
// const job = nodeCron.schedule('*/1 * * * *', getCallsAndDetails);

// job.start();


const server = app.listen(process.env.Port, () => {
    console.log("Started listening on " + process.env.Port);
})