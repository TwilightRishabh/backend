// require("dotenv").config({ path:"./.env"})

import dotenv from "dotenv"
import connectDb from './db/index.js'
// import { app } from './app.js'


dotenv.config({
    path:'./.env'
})


// connectDb()
//     .them(() => {
//         app.listen(process.env.Port || 8000, () => {
//         console.log(`server is running at port: ${process.env.PORT}`)
//         })
//             .catch((error) => {
//             console.log("MongoDb connection failed ",error)
//         })
// })


// import mongoose from "mongoose"
// import { DB_NAME } from "./constants"
// import express from "express"
// const app = express()
    
// (async () => {
//     try
//     {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

//         app.on("error", (error) => {
//             console.log("Error:", error)
//             throw error
//         })
//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on Port ${process.env.PORT} `)
//         })
//     }
//     catch (error)
//     {
//         console.log("MongoDB connection failed", error)
//         throw error
//     }
// })()