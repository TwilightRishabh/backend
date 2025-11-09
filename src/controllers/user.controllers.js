import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/User.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import{Jwt} from "jsonwebtoken" 



const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    console.log("✅ Found user:", user ? user._id : "not found");

    const accessToken = user.generateAccessToken();
    console.log("✅ Access Token created");

    const refreshToken = user.generateRefreshToken();
    console.log("✅ Refresh Token created");

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    console.log("✅ Tokens saved to user");

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("❌ ERROR in generateAccessAndRefreshToken:", error);
    throw new ApiError(500, "Something went wrong while generating refresh and access token");
  }
};






const registerUser = asyncHandler(async (req, res) => {
   

    // res.status(200).json({
    //     message:"ok"
    // })

    const { fullName, email, username, password } = req.body
    // console.log("email: ", email);


    if ([fullName, email, username, password].some((field) =>
        field?.trim()==="")
    )
    {
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await User.findOne({
        $or:[{username} , { email }]
    })


    if (existedUser)
    {
        throw new ApiError(409,"User with this username or email already exist.")
    }

    // console.log(req.files)

    const avatarLocalPath = req.files?.avatar?.[0]?.path;       //edited

     
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;       //edited

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
    {
        coverImageLocalPath = req.files.coverImage[0]?.path
    }


   


    if (!avatarLocalPath)
    {
        console.log("fkmsmdsdsdasdkasdafsdflsdf",req.files)        //edited
        throw new ApiError(400,"Avatar is Required")
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar)
    {
        throw new ApiError(400,"Avatar is Required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser)
    {
        throw new ApiError(500,"SOmething went wrong while regestering the user")
    }
    
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )
})


const loginUser = asyncHandler(async (req, res) => {
    //req body -> data
    //username or email
    // find the user 
    // password check 
    //access and refresh token
    //send cookie
    
    const { email, username, password } = req.body
    // console.log(email);

    if (!username && !email)
    {
        throw new ApiError(400,"username or email is required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if (!user)
    {
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid)
    {
        throw new ApiError(401,"Invalid user Creadentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    const options = { 
        httpOnly: true,
        secure:true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken,
            },
                "User Logged in Successfully"
            )
        )

})


const logoutUser = asyncHandler(async (req, res) => {
    
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToke: 1
                // This removes the field from document
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly: true,
        secure:true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200), {}, "User Logged Out")
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken)
    {
        throw new ApiError(401,"Unauthorised request")
    }

    try
    {

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken?._id)

        if (!user)
        {
             throw new ApiError(401,"Invalid refresh token")
        }
        if (incomingRefreshToken !== user?.refreshToken)
        {
             throw new ApiError(401,"Refresh token is expired or used")
        }
        

        const options = {
            httpOnly: true,
            secure:true
        }

        const {accessToken,newRefreshToken} = await generateAccessAndRefereshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                ApiResponse(200,
                    {
                        accessToken,refreshToken:newRefreshToken
                    },
                    "Access Token Refreshed"
                )
            )
    }
    catch (error)
    {
        throw new ApiError(401,error?.message|| "Invalid refresh token")
    }
})


const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect)
    {
        throw new ApiError(400,"Invalid oldPassword.")
    }

    user.password = newPassword

    await user.save({ validateBeforeSave: false })
    
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed Successfully."))
    
})


const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User Fecteched Successfully"))
})

const upadateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    if (!fullName || !email)
    {
        throw new ApiError(400,"fill the details those to be updated.")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,   //Es6 feature
                email:email
            },
        },

        {
            new:true
        }
        ).select("-password")
    
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details update Successfully"))

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar file is missing.")
    }

    //Todo : delete old image = assignement
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    
    if (!avatar.url)
    {
        throw new ApiError(400,"Error while uploading Avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar:avatar.url,
            }
        },
        {new:true}
    ).select("-password")


    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar image updated Successfully"))
})


const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath)
    {
        throw new ApiError(400,"coverImage file is missing.")
    }

    //Todo : delete old image = assignement
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if (!coverImage.url)
    {
        throw new ApiError(400,"Error while uploading coverImage")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage:coverImage.url,
            }
        },
        {new:true}
    ).select("-password")


    return res
        .status(200)
        .json(new ApiResponse(200, user, "coverImage updated Successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    upadateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
}