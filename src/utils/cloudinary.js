import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // remove local file after successful upload
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;
    } catch (error) {
        // remove local file if upload fails
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

// Delete file from Cloudinary
const deleteOnCloudinary = async (public_id, resource_type = "image") => {
    try {
        if (!public_id) return null;

        return await cloudinary.uploader.destroy(public_id, {
            resource_type
        });
    } catch (error) {
        console.log("delete on cloudinary failed", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteOnCloudinary };
