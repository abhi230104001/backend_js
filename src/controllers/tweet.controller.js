import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

/* CREATE TWEET */
const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "content is required");
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    });

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "tweet created successfully"));
});

/* UPDATE TWEET */
const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { tweetId } = req.params;

    if (!content) throw new ApiError(400, "content required");
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweetId");

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet not found");

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $set: { content } },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "tweet updated"));
});

/* DELETE TWEET */
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweetId");

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet not found");

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "tweet deleted"));
});

/* GET USER TWEETS */
const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid userId");

    const tweets = await Tweet.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [{ $project: { username: 1, "avatar.url": 1 } }]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likeDetails"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likeDetails" },
                ownerDetails: { $first: "$ownerDetails" },
                isLiked: {
                    $in: [req.user._id, "$likeDetails.likedBy"]
                }
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets fetched"));
});

export { createTweet, updateTweet, deleteTweet, getUserTweets };
