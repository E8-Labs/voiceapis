import express from "express";
import multer from "multer";
import {
  BuildYourAi,
  BuildAiScript,
  AddKnowledgebase,
  UpdateYourAi,
  DeleteKb,
  MyAi,
  AddTrait,
  DeleteTrait,
  UpdateTrait,
  AddUserValue,
  DeleteUserValue,
  UpdateUserValue,
  AddUserBelief,
  DeleteUserBelief,
  UpdateUserBelief,
  AddFramework,
  DeleteFramework,
  UpdateFramework,
  AddIntractionExample,
  DeleteIntractionExample,
  UpdateIntractionExample,
  AddPhilosophyAndViews,
  UpdateUserPhilosophyAndViews,
  DeletePhilosophyAndViews,
  AddPhrasesAndQuotes,
  UpdatePhrasesAndQuotes,
  DeletePhrasesAndQuotes,
  AddCommunicationInstruction,
  UpdateCommunicationInstruction,
  DeleteCommunicationInstruction,
  AddDonotDiscuss,
  UpdateDonotDiscuss,
  DeleteDonotDiscuss,
  AddCallStrategy,
  DeleteCallStrategy,
  UpdateCallStrategy,
  AddObjectionHandling,
  DeleteObjectionHandling,
  UpdateObjectionHandling,
} from "../controllers/buildai.controller.js";

import { verifyJwtToken } from "../middleware/jwtmiddleware.js";
const uploadFiles = multer().fields([{ name: "media", maxCount: 1 }]);

let AiRouter = express.Router();

AiRouter.post("/buildAi", verifyJwtToken, uploadFiles, BuildYourAi);
AiRouter.post("/buildAiScript", verifyJwtToken, uploadFiles, BuildAiScript);
AiRouter.post(
  "/addKnowledgebase",
  verifyJwtToken,
  uploadFiles,
  AddKnowledgebase
);
AiRouter.post("/updateAi", verifyJwtToken, uploadFiles, UpdateYourAi);
AiRouter.post("/deleteKb", verifyJwtToken, uploadFiles, DeleteKb);
AiRouter.get("/my_ai", verifyJwtToken, uploadFiles, MyAi);

AiRouter.post("/addTrait", verifyJwtToken, uploadFiles, AddTrait);
AiRouter.post("/deleteTrait", verifyJwtToken, uploadFiles, DeleteTrait);
AiRouter.post("/updateTrait", verifyJwtToken, uploadFiles, UpdateTrait);

AiRouter.post("/addFramework", verifyJwtToken, uploadFiles, AddFramework);
AiRouter.post("/deleteFramework", verifyJwtToken, uploadFiles, DeleteFramework);
AiRouter.post("/updateFramework", verifyJwtToken, uploadFiles, UpdateFramework);

AiRouter.post("/addUserValue", verifyJwtToken, uploadFiles, AddUserValue);
AiRouter.post("/deleteUserValue", verifyJwtToken, uploadFiles, DeleteUserValue);
AiRouter.post("/updateUserValue", verifyJwtToken, uploadFiles, UpdateUserValue);

AiRouter.post(
  "/addPhraseAndQuote",
  verifyJwtToken,
  uploadFiles,
  AddPhrasesAndQuotes
);
AiRouter.post(
  "/deletePhraseAndQuote",
  verifyJwtToken,
  uploadFiles,
  DeletePhrasesAndQuotes
);
AiRouter.post(
  "/updatePhraseAndQuote",
  verifyJwtToken,
  uploadFiles,
  UpdatePhrasesAndQuotes
);

AiRouter.post(
  "/addCommunicationInstruction",
  verifyJwtToken,
  uploadFiles,
  AddCommunicationInstruction
);
AiRouter.post(
  "/deleteCommunicationInstruction",
  verifyJwtToken,
  uploadFiles,
  DeleteCommunicationInstruction
);
AiRouter.post(
  "/updateCommunicationInstruction",
  verifyJwtToken,
  uploadFiles,
  UpdateCommunicationInstruction
);

AiRouter.post("/addDonotDiscuss", verifyJwtToken, uploadFiles, AddDonotDiscuss);
AiRouter.post(
  "/deleteDonotDiscuss",
  verifyJwtToken,
  uploadFiles,
  DeleteDonotDiscuss
);
AiRouter.post(
  "/updateDonotDiscuss",
  verifyJwtToken,
  uploadFiles,
  UpdateDonotDiscuss
);

AiRouter.post(
  "/addIntractionExample",
  verifyJwtToken,
  uploadFiles,
  AddIntractionExample
);
AiRouter.post(
  "/deleteIntractionExample",
  verifyJwtToken,
  uploadFiles,
  DeleteIntractionExample
);
AiRouter.post(
  "/updateIntractionExample",
  verifyJwtToken,
  uploadFiles,
  UpdateIntractionExample
);

AiRouter.post(
  "/addUserPhilosophy",
  verifyJwtToken,
  uploadFiles,
  AddPhilosophyAndViews
);
AiRouter.post(
  "/deleteUserPhilosophy",
  verifyJwtToken,
  uploadFiles,
  DeletePhilosophyAndViews
);
AiRouter.post(
  "/updateUserPhilosophy",
  verifyJwtToken,
  uploadFiles,
  UpdateUserPhilosophyAndViews
);

AiRouter.post("/addUserBelief", verifyJwtToken, uploadFiles, AddUserBelief);
AiRouter.post(
  "/deleteUserBelief",
  verifyJwtToken,
  uploadFiles,
  DeleteUserBelief
);
AiRouter.post(
  "/updateUserBelief",
  verifyJwtToken,
  uploadFiles,
  UpdateUserBelief
);

AiRouter.post("/addCallStrategy", verifyJwtToken, uploadFiles, AddCallStrategy);
AiRouter.post(
  "/deleteCallStrategy",
  verifyJwtToken,
  uploadFiles,
  DeleteCallStrategy
);
AiRouter.post(
  "/updateCallStrategy",
  verifyJwtToken,
  uploadFiles,
  UpdateCallStrategy
);

AiRouter.post(
  "/addObjectionHandling",
  verifyJwtToken,
  uploadFiles,
  AddObjectionHandling
);
AiRouter.post(
  "/deleteObjectionHandling",
  verifyJwtToken,
  uploadFiles,
  DeleteObjectionHandling
);
AiRouter.post(
  "/updateObjectionHandling",
  verifyJwtToken,
  uploadFiles,
  UpdateObjectionHandling
);

export default AiRouter;
