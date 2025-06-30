class ApiError extends Error{// ApiError class inherit all propof in built Error class of node.js
    constructor(
        statusCode,
        message="something went wrong",
        errors= [],
        statck = ""

    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.sucess = false;
        this.errors = errors

        if(statck){
            this.stack = statck
        }else{
            Error.captureStackTrace(thid,
                this.constructor
            )
        }
    }
}

export {ApiError}