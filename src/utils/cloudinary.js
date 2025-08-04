import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"// fs is file system library from node js

 cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME , 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    const uploadOnCloudinary = async (loaclFilePath)=>{
        try{
            if(!loaclFilePath) return null
            // uplaod the file on cloudinary
            const response = await cloudinary.uploader.upload
            (loaclFilePath,{
                resource_type:"auto"
            })
            // file uploaded successfull
            //console.log("file is uploade on cloudinary",response.url);
            fs.unlinkSync(loaclFilePath)
            return response;
        }catch(error){
            fs.unlinkSync(loaclFilePath)/*remove the locallly
           saved tempory file as the upload opreattion got failed*/
           return null

        }
    }

    const deleteOnCloudinary = async (public_id, resource_type="image") => {
    try {
        if (!public_id) return null;

        //delete file from cloudinary
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: `${resource_type}`
        });
       
    } catch (error) {
         console.log("delete on cloudinary failed", error);
        return error;
       
    }
};


    export {uploadOnCloudinary,deleteOnCloudinary }