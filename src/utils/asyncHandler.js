const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req ,res,next)).catch((err)=>next(err))
    }
}

export {asyncHandler}


// steps to remember how it is made

// const asyncHandler = ()=>{}
// const asyncHandler = (fn)=>{ ()=> { } }
// const asyncHandler = (fn)=>{ async ()=> { } }
// const asyncHandler = (fn)=> async ()=> { } 


// const asyncHandler = (fn) => async (req, res, next) => {
    
//     try {
//         await fn(req,res,next)
//     }
//     catch (error)
//     {
//         res.status(err.code || 500).JSON({
//             success: false,
//             message: err.message,
//         })
//     }
    
// }