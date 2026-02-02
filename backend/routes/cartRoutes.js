import express from "express"
import { addToCart, UpdateCart } from "../controller/cartController.js"
const cartRoutes=express.Router()
import isAuth from "../middleware/isAuth.js"
import { getUserCart } from "../controller/cartController.js"

cartRoutes.post("/get",isAuth,getUserCart)
cartRoutes.post("/add",isAuth,addToCart)
cartRoutes.post("/update",isAuth,UpdateCart)

export default cartRoutes