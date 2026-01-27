import mongoose from "mongoose"

const orderSchema=new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    items:{
        type:Array,
        required:true
    },
    amount:{
        type:Number,
        requird:true
    },address:{
        type:Object,
        required:true
    },status:{
        type:String,
        required:true,
        default:"Order Placed"
    },
    payment:{
        type:Boolean,
        required:true,
        default:false
    },
    date:{
        type:Number,
        required:true
    },
    paymentMethod:{
        type:String,
        required:true
    },
    idempotencyKey:{
        type:String,
        unique:true,
        sparse:true,
        index:true
    }
},{timeStamp:true})

const Order=mongoose.model("Order",orderSchema)
export default Order
