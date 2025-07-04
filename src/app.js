import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

/// app.use()=> use it when we have to do middlewaver or configuration settting
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))// configuration of cors

app.use(express.json({limit: "16kb"}))// config json to handle json data 
app.use(express.urlencoded({extended:true,limit:"16kb"}))// config express to hadle data coming from url
app.use(express.static("public"))// this will store file images on server
app.use(cookieParser())// config cookies

// routes declaration
 import userRouter from './routes/user.routes.js'

 // routes declaration 

 app.use("/api/v1/users",userRouter)

 //http://localhost:8000/api/v1/users/register




export {app}