import express from "express"
import { allOrders, placeOrder, placeOrderRazorpay, updateStatus, userOrders, verifyRazorpay } from "../controller/orderController.js"
import isAuth from "../middleware/isAuth.js"
import adminAuth from "../middleware/adminAuth.js"

const orderRoutes=express.Router()

//for User
orderRoutes.post("/placeorder",isAuth,placeOrder)
orderRoutes.post("/userorder",isAuth,userOrders)
orderRoutes.post("/razorpay",isAuth,placeOrderRazorpay)
orderRoutes.post("/verifyrazorpay",isAuth,verifyRazorpay)


//for Admin
orderRoutes.post("/list",adminAuth,allOrders)
orderRoutes.post("/status",adminAuth,updateStatus)
export default orderRoutes