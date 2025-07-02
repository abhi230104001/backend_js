class ApiError extends Error{// ApiError class inherit all prop of in built Error class of node.js
    constructor(
        statusCode,
        message="something went wrong",
        errors= [],
        stack = ""

    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.sucess = false;
        this.errors = errors

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(thid,
                this.constructor
            )
        }
    }
}

export {ApiError}