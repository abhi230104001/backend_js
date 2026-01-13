import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

export const app = express()

/// app.use()=> use it when we have to do middlewaver or configuration settting
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))// configuration of cors

app.use(express.json({limit: "16kb"}))// config json to handle json data 
app.use(express.urlencoded({extended:true,limit:"16kb"}))// config express to hadle data coming from url
app.use(express.static("public"))// this will store file images on server
app.use(cookieParser())// config cookies

// routes import
 import userRouter from './routes/user.routes.js'
 import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import videoRouter from "./routes/video.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

 // routes declaration 

app.use("/api/v1/users", userRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);


 //http://localhost:8000/api/v1/users/register




export default app;