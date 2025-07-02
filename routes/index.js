const userRouter = require('./userRoute')
// const conversationRouter = require('./conversation')
// const messageRouter = require('./message')
// const postRouter = require('./postRoute')
// const commentRouter = require('./commentRoute')
const initRoutes = (app) => {
    app.use('/api/v1', userRouter)
    // app.use('/api', conversationRouter)
    // app.use('/api/message', messageRouter)
    // app.use('/api/post', postRouter),
    // app.use('/api', commentRouter)
}

module.exports = initRoutes