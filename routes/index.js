import userRouter from "./userRoute.js";
import relationshipRouter from "./relationshipRoute.js";
import postRouter from "./postRoute.js";
import messageRouter from "./messageRoute.js";
import conversationRoute from "./conversationRoute.js";

const initRoutes = (app) => {
  app.use("/api/v1", userRouter),
    app.use("/api/v1/relationship", relationshipRouter),
    app.use("/api/v1/post", postRouter),
    app.use("/api/v1/message", messageRouter),
    app.use("/api/v1/conversation", conversationRoute);
};

export default initRoutes;
