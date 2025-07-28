import mongoose, { Schema } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";



// get all comment of video
const getVideoComments = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    const {page =1,limit= 10} = req.query;

    const video = await Video.findById(videoId);

    if(!video){
       throw  new ApiError(404,"video is not found");

    }
    const commentsAggregate = Comment.Aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignFeild:"_id",
                as:"owner"

            }

        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignFeild:"comment",
                as:"likes"
            }
        },
        {
            $addFeilds:{
                likesCount:{
                    $size: "$likes"
                },
                owner:{
                    $first:"$owner"
                },
                isLiked:{
                    $cond:{
                        if:{$in:[req.user?._id,"$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
         {
            $project: {
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                },
                isLiked: 1
            }
        }
    ]);

    const options = {
        page: parseInt(page,10),
        limit: parseInt(limit,10)
    };

    const comments = await Comment.aggregatePaginate(
        commentsAggregate,
        options
    )

    return res
    .status(200)
    .json(new ApiResponse(200,comments,"comments fetched succesfullly"));

});

// add a comment to video

const addComment = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    const {content} = req.content;

    if(!content){
        throw new ApiError(400,"content is required")
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404,"Video is not found")

    }

    const comment = await Comment.create({
        content,
        video:videoId,
        owner:  req.user?.id
    });

    if(!comment){
        throw new ApiError(500,"Failed to add comment please try again later");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,comment,"Comment is added successfully"))
});

// update comment

const updateComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params;
    const {content} = req.content;

    if(!content){
        throw new ApiError(400,"Content is required")
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404,"Comment not found")
    }
    if(comment?.owner.tostring()!==req.user?._id.tostring()){
        throw new ApiError(400, "only comment owner can edit their comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        comment?._id,
       {
         $set:{
            content
        }
    },
    {new: true}

    );
    
    if(!updatedComment){
        throw new ApiError(500,"failed in updating try after sometime")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updateComment,"comment has been updated successfully"))


});

// delete comment

const deleteComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params;
    
    const comment  = await Comment.findById(commentId);
        
    if(!comment){
        throw new ApiError(404,"comment is not found")
    }

    if(comment?.owner.tostring()!==req.user?._id.tostring()){
        throw new ApiError(400,"Only owner can delete the comment")
    }
   await Comment.findByIdAndDelete(commentId);

   await Like.deleteMany({
        comment: commentId,
        likedBy: req.user
    });

    return res
    .status(200)
    .json(new ApiResponse(200,comment,"Comment is deleted"));
});

export {getVideoComments,addComment,updateComment,deleteComment};

