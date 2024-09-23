import express from "express";

import { MakeACall, GetACall, GetRecentAndOngoingCalls, GenSummary} from "../controllers/call.controller.js";// 'controllers/call.controller.js';
//"../controllers/call.controller.js";



let callRouter = express.Router();


callRouter.post("/make_a_call", MakeACall);
callRouter.post("/gen_summary", GenSummary);
callRouter.get("/get_a_call", GetACall);
callRouter.get("/get_recent_calls", GetRecentAndOngoingCalls);


export default callRouter 