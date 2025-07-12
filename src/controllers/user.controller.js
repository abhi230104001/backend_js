import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from  "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefereshTokens = async(userId)=>{
    try{

        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false})// saving refresh token in db
        return {accessToken,refreshToken}

    }catch(error){
        throw new ApiError(500,"something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req,res)=>{
    // st.1=> get user detail from frontend
    //st.2=> validation - not empty
    // st.3 check if user already exits: username,email
    // st.4=> check for images ,check for avatar
    // st.5=> upload them on cloudinary ,avatar
    // st.6=> create user object- create entry in db
    // st.7=> remove password and refresh token fiedd from response
    // st.8=> check for user creation
    // return response

    // taking user detail

    const {fullName,email,username,password}  = req.body
    console.log("email",email);
    if(
        [fullName,email,username,password].some((field)=>
        field?.trim()==="")
    ){
       throw new ApiError(400,"All feilds are required")
    }

    // checking st.3
    const existedUser = await User.findOne({
        $or:[{ username},{email}]   // (username|| email)
    })

    if(existedUser){
        throw new ApiError(409,"User witn email or username already exists")
    }

      // st.4
      //console.log(req.files);

      const avatarLocalPath = req.files?.avatar[0]?.path;

      //const coverImageLocalPath = req.files?.coverImage[0]?.path;

      let coverImageLocalPath;
      if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
         coverImageLocalPath = req.files.coverImage[0].path
      }

     if(!avatarLocalPath){
        throw new ApiError(400," Avatar file is required")
     }      
      
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar){
     throw new ApiError(400," Avatar file is required")
   }

   // st.6

   const user =  await User.create({
           fullName,
           avatar: avatar.url,
           coverImage: coverImage?.url||"",
           email,
           password,
           username: username.toLowerCase()
    })

    // st.7

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
  // st.8
    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering the user")
    }

    // returning reaponse

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User is registered Successfully ")
    )



})

const loginUser = asyncHandler(async (req,res)=>{
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const {email,username,password} = req.body
    console.log(email);

 if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or:[{username},{email}]
    })
 if(!user){
    throw new ApiError(404,"User does not exist")
 }

 const  isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new ApiError(404,"Invalid user credentails")
 }
const {accessToken,refreshToken}= await generateAccessAndRefereshTokens(user._id)

const loggedInUser = await User.findById(user._id).
select("-password -refreshToken")

// sending the cookies

const options ={
    httpOnly: true,
    secure: true
}

return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new ApiResponse(
        200,
        {
            user: loggedInUser, accessToken,refreshToken
        },
        "User logged In Successfully "

    )
)


})


const logoutUser = asyncHandler(async(req,res)=>{
  
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined // removing refresh token from database
            }
        },
        {
            new: true
        }
    )


    const options ={
    httpOnly: true,
    secure: true
}
 return res
 .status(200)
 .clearCookie("accessToken",options)
 .clearCookie("refreshToken",options)
 .json(new ApiResponse(200,{},"User logout "))

})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401,"unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
             incomingRefreshToken,
             process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !==user?.refreshToken){
            throw new ApiError(401,"Refresh token is expire or used")
        }
        
        const options ={
            httpOnly: true,
            secure: true
        }
    
        const {accessToken,newRefreshToken}= await generateAccessAndRefereshTokens(user._id)
        return res
           .status(200)
           .cookie("accessToken",accessToken,options)
           .cookie("refreshToken",newRefreshToken,options)
           .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed"
            )
           )
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid refresh token")
        
    }


})

export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
}    