const userRouter = require("./userRoute");
const relationshipRouter = require("./relationshipRoute");
const postRouter = require("./postRoute");
const messageRouter = require("./messageRoute");

const initRoutes = (app) => {
  app.use("/api/v1", userRouter),
    app.use("/api/v1/relationship", relationshipRouter),
    app.use("/api/v1/post", postRouter),
    app.use("/api/v1/message", messageRouter);
};

module.exports = initRoutes;
