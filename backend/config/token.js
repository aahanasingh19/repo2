import jwt from "jsonwebtoken"

export const genToken=async (userId)=>{
try{
    let token= jwt.sign({userId},process.env.JWT_SECRET,{expiresIn:"7d"})
    return token
}catch(err){
    console.log("token error   " +err.message)
}
}



export const genToken1=async (email)=>{
try{
    let token= jwt.sign({email},process.env.JWT_SECRET,{expiresIn:"7d"})
    return token
}catch(err){
    console.log("token error   " +err.message)
}
}