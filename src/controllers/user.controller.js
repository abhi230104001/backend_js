import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from  "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


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

    const {fullname,email,username,password}  = req.body
    console.log("email",email);
    if(
        [fullname,email,username,password].some((field)=>
        field?.trim()==="")
    ){
       throw new ApiError(400,"All feilds are required")
    }

    // checking st.3
    const existedUser = User.findOne({
        $or:[{ username},{email}]   // (username|| email)
    })

    if(existedUser){
        throw new ApiError(409,"User witn email or username already exists")
    }

      // st.4

      const avatarLocalPath = req.files?.avatar[0]?.path;

      const coverImageLocalPath = req.files?.coverImage[0]?.path;

     if(!avatarLocalPath){
        throw new ApiError(400," Avatar file is required")
     }      
      
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar){
     throw new ApiError(400," Avatar file is required")
   }

   // st.6

   const user =  User.create({
           fullName,
           avatar: avatar.url,
           coverImage: coverImage?.url||"",
           email,
           password,
           username: username.toLowerCase()
    })

    // st.7

    const createUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
  // st.8
    if(createUser){
        throw new ApiError(500,"something went wrong while registering the user")
    }

    // returning reaponse

    return res.status(201).json(
        new ApiResponse(200,createUser,"User is registered Successfully ")
    )



})




export {registerUser,}