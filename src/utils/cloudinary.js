import { v2 as cloudinary } from "cloudinary"

import fs from "fs"
 

// import dotenv from "dotenv";
// dotenv.config({ path: "./.env" });







cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});



const uploadOnCloudinary = async (localFilePath) => {
    
    try
    {
        if (!localFilePath) return null;
        
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        //file hs been uploaded successfully


        // console.log("File uploaded on cloudinary", response.url);

        fs.unlinkSync(localFilePath);
        console.log("try block")

        return response;

    }
    catch (error)
    {
        fs.unlinkSync(localFilePath)   //remove the locally saved temporary file as the upload operation got failed
        console.log("catch block")
        return null;
    }
}

export {uploadOnCloudinary}