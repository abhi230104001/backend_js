import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";

/* =========================
   GET ALL VIDEOS
========================= */
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    const pipeline = [];

    if (query) {
        pipeline.push({
            $search: {
                index: "search-videos",
                text: {
                    query,
                    path: ["title", "description"]
                }
            }
        });
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    pipeline.push({ $match: { isPublished: true } });

    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        { $unwind: "$ownerDetails" }
    );

    const videoAggregate = Video.aggregate(pipeline);
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const videos = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

/* =========================
   PUBLISH VIDEO
========================= */
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if ([title, description].some(field => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }

    const videoPath = req.files?.videoFile?.[0]?.path;
    const thumbnailPath = req.files?.thumbnail?.[0]?.path;

    if (!videoPath || !thumbnailPath) {
        throw new ApiError(400, "Video and thumbnail are required");
    }

    const videoFile = await uploadOnCloudinary(videoPath);
    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    const video = await Video.create({
        title,
        description,
        duration: videoFile.duration,
        videoFile: {
            url: videoFile.url,
            public_id: videoFile.public_id
        },
        thumbnail: {
            url: thumbnail.url,
            public_id: thumbnail.public_id
        },
        owner: req.user._id,
        isPublished: false
    });

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video uploaded successfully"));
});

/* =========================
   GET VIDEO BY ID
========================= */
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        }
    ]);

    if (!video.length) {
        throw new ApiError(404, "Video not found");
    }

    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { watchHistory: videoId }
    });

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});

/* =========================
   UPDATE VIDEO
========================= */
const updateVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized");
    }

    const thumbnailPath = req.file?.path;
    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: {
                    public_id: thumbnail.public_id,
                    url: thumbnail.url
                }
            }
        },
        { new: true }
    );

    await deleteOnCloudinary(video.thumbnail.public_id);

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

/* =========================
   DELETE VIDEO
========================= */
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized");
    }

    await Video.findByIdAndDelete(videoId);
    await Like.deleteMany({ video: videoId });
    await Comment.deleteMany({ video: videoId });

    await deleteOnCloudinary(video.thumbnail.public_id);
    await deleteOnCloudinary(video.videoFile.public_id, "video");

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

/* =========================
   TOGGLE PUBLISH STATUS
========================= */
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: video.isPublished },
                "Publish status toggled"
            )
        );
});

/* =========================
   EXPORTS
========================= */
export {
    publishAVideo,
    updateVideo,
    deleteVideo,
    getAllVideos,
    getVideoById,
    togglePublishStatus
};
