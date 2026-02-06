
import jwt from "jsonwebtoken"
const isAuth=async(req,res,next)=>{
    console.log("isAuth called")

    
    try{
    let {token}=req.cookies

    if(!token){
        return res.status(500).json({message:"user doesn't have a token"})
    }
    let verifyToken=jwt.verify(token,process.env.JWT_SECRET)
    
    if(!verifyToken ){
        return  res.status(500).json({message:"user doesn't have a valid token"})
    }

    req.userId=verifyToken.userId
        next()
    }catch(error){
        console.log("isAuth error")
        return res.status(500).json({message:`is Auth error ${error}`})
    }

    
}


export default isAuth 