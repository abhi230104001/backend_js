import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
import {User} from "../models/user.model"




export const verifyJwt = asyncHandler(async(req, _, next)=>{

 
    
 try{
    const token = req.cookies?.accessToken || req.header(
    "Authorization")?.replace("Bearer ","")

    if(!token){
        throw new ApiError(401,"Unauthorized request")

    }

   const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
 
   const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

   if(!user){
    throw new ApiError(401,"Invalid user")
   }

   req.user = user;// adding new object to in req.body
   next()
}catch(error){
    throw new ApiError(402,error?.message|| "Invalid access token")
}

 

})