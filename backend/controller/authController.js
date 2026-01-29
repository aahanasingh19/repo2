import User from "../model/userModel.js"
import validator from "validator"
import bcrypt from "bcryptjs"
import { genToken ,genToken1} from "../config/token.js"




const cookieOptions = {
  httpOnly: true,
  secure: false,                         // true only on HTTPS
  sameSite: "lax",      // lax for HTTP
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const registration=async (req,res) =>{
  
    try{
        const {name,email,password}=req.body
        console.log(name)
        console.log(email)
        console.log(password)
        const existUser=await User.findOne({email})
        if(existUser){
            console.log("user exist")
            return res.status(400).json({message:"user already exists"})

        }
        if(!validator.isEmail(email)){
            console.log("email not valid exist")
            return res.status(400).json({message:"ENTER valid email"})
        }
        if(password.length<8){
            console.log("password error")
            return res.status(400).json({message:"Enter strong password"})
        }
        let hashpassword=await bcrypt.hash(password,10)

        const user=await User.create({name,email,password:hashpassword})
        console.log(user)
        console.log("user id "   + user._id +" to check if this is an object or a string " + typeof(user._id))
        let token =await genToken(user._id)

        res.cookie("token", token, cookieOptions);

        return res.status(201).json(user)

    }catch(err){
      console.log("register  error")
      return res.status(500).json({message:`registration error ${err}`})
    }
}

export const login=async(req,res)=>{
    console.log("login initiated")
    try{
         let {email,password}=req.body
         console.log(email)
         console.log(password)

         let user=await User.findOne({email})
         console.log(user)
         if(!user){
            return res.status(404).json({message:"user not found"})
         } 
         console.log("comparing password")
         let isMatch=await bcrypt.compare(password,user.password)
         console.log("password compared")
         if(!isMatch){   
            return res.status(400).json({message:"Incorrect password"})
         }
         let token=await genToken(user._id)
         console.log("token generated")

        //  res.cookie("token",token,{
        //       httpOnly:true,
        //       secure:false,
        //       sameSite:"none",
        //       maxAge:7*24*60*60*1000
        //  })

        res.cookie("token", token, cookieOptions);
            console.log("cookie set")

        //  return res.status(201).json({message:"login successfull"})
         return res.status(201).json(user)

    }catch(err){
        console.log("login error")
      return res.status(500).json({message:`login error ${err}`})
    }

}


export const logout =async (req,res)=>{
try{
    res.clearCookie("token")
    return res.status(200).json({message:"logout successfull"})

}catch(err){
    console.log("logout error")
    return res.status(500).json({message: `logout error ${err}`})
}
}

export const googleLogin =async (req,res)=>{
    try{
        
let {name,email}=req.body

let user=await User.findOne({email})
if(!user){
    user= await User.create({name,email})
}
         let token=await genToken(user._id)
          
         res.cookie("token", token, cookieOptions);

         return res.status(200).json(user)
        }catch(error){
            console.log("google login error")
            return res.status(500).json({message: ` login error ${error.message}`})
        }
}

export const adminLogin= async(req,res)=>{
    try{
        let{email,password}=req.body
          if(email===process.env.ADMIN_EMAIL && password===process.env.ADMIN_PASSWORD){
            let token=await genToken1(email)
                     res.cookie("token", token, cookieOptions);

         return res.status(200).json(token)
          }
          return res.status(400).json({message:"Invalid credentials"})

    }catch(error){
        console.log("adminLogin error")
        return res.status(500).json({message: ` adminlogin error ${error.message}`})
    }
}
