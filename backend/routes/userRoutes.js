import express from "express"
import { getAdmin, getCurrentUser } from "../controller/userController.js"
import isAuth from "../middleware/isAuth.js"
import adminAuth from "../middleware/adminAuth.js"

let userRoutes=express.Router()
 
userRoutes.post("/getcurrentuser",isAuth,getCurrentUser)
userRoutes.get("/getadmin",adminAuth,getAdmin)

export default userRoutes