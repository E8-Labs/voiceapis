import express from "express";
import multer from "multer";
import {
  BuildYourAi,
  CreateProfessionAndObjectAfterProfileCompletion,
  BuildAiScript,
  AddKnowledgebase,
  UpdateYourAi,
  DeleteKb,
  DeleteKyc,
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
  AddDemeanor,
  UpdateDemeanor,
  DeleteDemeanor,
  AddInterpersonalSkills,
  UpdateInterpersonalSkills,
  DeleteInterpersonalSkills,
  UpdateProductFaqs,
  DeleteProductFaqs,
  AddProductFaqs,
  AddCommunicationCommonFaqs,
  UpdateCommunicationCommonFaqs,
  DeleteCommunicationCommonFaqs,
  AddCommunicationStyle,
  DeleteCommunicationStyle,
  UpdateCommunicationStyle,
} from "../controllers/buildai.controller.js";

import { verifyJwtToken } from "../middleware/jwtmiddleware.js";
const uploadFiles = multer().fields([{ name: "media", maxCount: 1 }]);

let AiRouter = express.Router();

AiRouter.post("/buildAi", verifyJwtToken, uploadFiles, BuildYourAi);
AiRouter.post("/buildAiScript", verifyJwtToken, uploadFiles, BuildAiScript);
AiRouter.post(
  "/processObjectiveAndProfession",
  verifyJwtToken,
  CreateProfessionAndObjectAfterProfileCompletion
);
AiRouter.post(
  "/addKnowledgebase",
  verifyJwtToken,
  uploadFiles,
  AddKnowledgebase
);
AiRouter.post("/updateAi", verifyJwtToken, uploadFiles, UpdateYourAi);
AiRouter.post("/deleteKb", verifyJwtToken, uploadFiles, DeleteKb);
AiRouter.post("/deleteKyc", verifyJwtToken, uploadFiles, DeleteKyc);
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

AiRouter.post("/addDemeanor", verifyJwtToken, uploadFiles, AddDemeanor);
AiRouter.post("/deleteDemeanor", verifyJwtToken, uploadFiles, DeleteDemeanor);
AiRouter.post("/updateDemeanor", verifyJwtToken, uploadFiles, UpdateDemeanor);

AiRouter.post(
  "/addInterpersonalSkills",
  verifyJwtToken,
  uploadFiles,
  AddInterpersonalSkills
);
AiRouter.post(
  "/deleteInterpersonalSkills",
  verifyJwtToken,
  uploadFiles,
  DeleteInterpersonalSkills
);
AiRouter.post(
  "/updateInterpersonalSkills",
  verifyJwtToken,
  uploadFiles,
  UpdateInterpersonalSkills
);

AiRouter.post("/addProductFaqs", verifyJwtToken, uploadFiles, AddProductFaqs);
AiRouter.post(
  "/deleteProductFaqs",
  verifyJwtToken,
  uploadFiles,
  DeleteProductFaqs
);
AiRouter.post(
  "/updateProductFaqs",
  verifyJwtToken,
  uploadFiles,
  UpdateProductFaqs
);

AiRouter.post(
  "/addCommonFaqs",
  verifyJwtToken,
  uploadFiles,
  AddCommunicationCommonFaqs
);
AiRouter.post(
  "/deleteCommonFaqs",
  verifyJwtToken,
  uploadFiles,
  DeleteCommunicationCommonFaqs
);
AiRouter.post(
  "/updateCommonFaqs",
  verifyJwtToken,
  uploadFiles,
  UpdateCommunicationCommonFaqs
);

AiRouter.post(
  "/addCommunicationStyle",
  verifyJwtToken,
  uploadFiles,
  AddCommunicationStyle
);
AiRouter.post(
  "/deleteCommunicationStyle",
  verifyJwtToken,
  uploadFiles,
  DeleteCommunicationStyle
);
AiRouter.post(
  "/updateCommunicationStyle",
  verifyJwtToken,
  uploadFiles,
  UpdateCommunicationStyle
);

export default AiRouter;
