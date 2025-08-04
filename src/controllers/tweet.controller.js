import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";







const createTweet = asyncHandler(async(req,res)=>{
    const {content} = req.body;

    if(!content){
        throw new ApiError(400,"content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id,

    });

    if(!tweet){
        throw new ApiError(500," failed to upload the twet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"tweet created successfully"));

});

const updateTweet = asyncHandler(async(req,res)=>{
    const {content} = req.body;
    const {tweetId} = req.params;

    if(!content){
        throw new ApiError(400,"tweet is required");
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet id");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(400," tweet is not found")
    }

    if(tweet?.owner.tostring()!==req.user?._id){
        throw new ApiError(400,"only owner can edit their tweet");
    }

    const newTweet = await Tweet.findByIdAndUpdate (
        tweetId,
        {
            $set:{
                content,
            },
        },
        {new: true}
    );

    if(!newTweet){
        throw new ApiError(500,"failed to edit please try again later")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,newTweet," Tweet is updated successfully"));
});

const deleteTweet = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet id");
        
    }
    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(404,"tweet not found");
    }
    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can delete thier tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
    .status(200)
    .json(new ApiResponse(200,"tweet is deleted successfully"))

});

const getUserTweets = asyncHandler(async(req,res)=>{
    const {userId} = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const tweets = await Tweet.aggregate([
        {
            $match:{
                owner: new n=mongoose.Types.ObjectId(userId);

            }
        },
        {
            $lookup:{
                from: "users",
                localField:"owner",
                foreignField:"_id",
                as: "ownerDetails",
                pipeline:[
                    {
                         $project: {
                            username: 1,
                            "avatar.url": 1,
                        },
                    },
                ],


            },
        },
        {
            $lookup:{
                  from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likeDetails",
                 pipeline: [
                    {
                        $project: {
                            likedBy: 1,
                        },
                    },
                ],
            },
        },

          {
            $addFields: {
                likesCount: {
                    $size: "$likeDetails",
                },
                ownerDetails: {
                    $first: "$ownerDetails",
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likeDetails.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            },
        },
          {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1
            },
        },
    ]);
       return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));

});

export { createTweet, updateTweet, deleteTweet, getUserTweets };