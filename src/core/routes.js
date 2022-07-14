import checkLogin from "../utils/validations/login.js";
import DialogController from "../controllers/dialogController.js";
import UserController from "../controllers/userController.js";
import MessageController from "../controllers/messageController.js";
import bodyParser from "body-parser";
import updateLastSeen from "../middlewares/updateLastSeen.js";
import checkAuth from "../middlewares/checkAuth.js";
import cors from "cors";
import checkRegistration from "../utils/validations/registration.js";
import UploadController from "../controllers/uploadController.js";
import multer from "./multer.js";

const routes = (app, io) => {
  const dialogController = new DialogController(io);
  const userController = new UserController(io);
  const messageController = new MessageController(io);
  const uploadFileController = new UploadController();

  const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
    optionSuccessStatus: 200,
  };

  app.use(cors(corsOptions));
  app.use(bodyParser.json());
  app.use(checkAuth);
  app.use(updateLastSeen);

  app.post("/dialogs", dialogController.create);
  app.get("/dialogs", dialogController.show);
  app.delete("/dialogs/:id", dialogController.delete);

  app.get("/user/me", userController.getMe);
  app.get("/user/find", userController.findUsers);
  app.get("/user/registration/verify", userController.verify);
  app.post("/user/registration", checkRegistration, userController.create);
  app.post("/user/login", checkLogin, userController.login);
  app.delete("/user/:id", userController.delete);
  app.get("/user/:id", userController.show);

  app.get("/messages", messageController.show);
  app.post("/messages", messageController.create);
  app.delete("/messages/:id", messageController.delete);

  app.post("/files", multer.single("file"), uploadFileController.create);
  app.delete("/files", uploadFileController.delete);
};

export default routes;
