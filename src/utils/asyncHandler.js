const asyncHandler =(requestHandler)=>{// taing functon as parameter
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }

}

export {asyncHandler}


// method 2 for same thing

/*

const asyncHandler = ()=>{}
const asyncHandler = (func)=>()=>{}
const asyncHandler = (func)=> async ()=>{}

    // explanation of below of function

    const asyncHandler =(fn) => async(res,res,next)=>{ // taking function as parameter
       try{
       await fn(req,res,next)} 
        } catch(error){
        res.status(err.code||500).json({
        success: false,
        message: err.message
        }) 
        }
*/

