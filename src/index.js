//require('dotenv').config({path:'./env'})
import connectDB from "./db/index.js";
import dotenv from "dotenv"

dotenv.config({
    path:'./env'
})

connectDB()// give promises
.then(()=>{
  app.listen(process.env.PORT||8000,()=>{
    console.log(`secver is running at port : ${process.env.PORT}`);
  })
})
.catch((err)=>{
  console.log("MONGO DB CONNECTION FAILDED !!!", err)
})


//approach one to connect database;
/*
import express from "express"

const app = express()

( async()=>{
 try{
  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
  app.on("error",(error)=>{
    console.log("error",error);
    throw error
  })

  app.listen(process.env.PORT,()=>{
    console.log(`app is listening on port ${process.env.PORT}`);
  })
 } catch(error){
    console.log("error",error)

 }
})()*/