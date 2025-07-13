import mongoose,{Schema} from "mongoose";

const subsciptionSchema = new Schema({
  
    subscriber:{
        type: Schema.Types.ObjectId,// onr who is subscribing
        ref: "User"
    },
    channel:{
        type: Schema.Types.ObjectId,// one to who subscriber is subscribing
           ref: "User"

    }


},{timestamps: true})



export const subsciption = mongoose.model("Subsciption",subsciptionSchema)