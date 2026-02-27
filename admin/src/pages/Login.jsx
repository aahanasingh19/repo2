import React ,{useState} from 'react'
import logo from "../assets/vcart logo.png"
import { IoEyeOutline } from "react-icons/io5";
import { IoEye } from "react-icons/io5";
import { useContext } from 'react';
import { authDataContext } from '../context/AuthContext';
import axios from "axios"
import { adminDataContext } from '../context/UserContext';
import {useNavigate} from  "react-router-dom"
import {toast} from "react-toastify"
import Loading from '../components/Loading';


function Login() {
    let navigate=useNavigate()
      const[loading,setLoading]=useState(false)  
    let [show,setShow]=useState(false)
            let {serverUrl}= useContext(authDataContext)
                 let [email,setEmail]=useState("admin@onecart.com")
            let [password,setPassword]=useState("admin1234567")
            let {adminData,getAdmin} =useContext(adminDataContext)

            const AdminLogin=async(e)=>{
              setLoading(true)
                e.preventDefault();
                try{
                    
                       const result =await axios.post("/api/auth/adminlogin",{email,password},{withCredentials:true})
                       console.log(result.data)
                       toast.success("Admin login successfully")
                       setLoading(false)
                       getAdmin()
                       navigate("/")
                }catch(error){
                            console.log(error)
                            toast.error("Admin login failed")
                }
            }
  return (
   
   
        <div className='w-[100vw] h-[100vh] bg-gradient-to-l from-[#141414] to-[#0c2025] text-[white] flex flex-col items-center justifiy-start'>
                 <div className="w-[100%] h-[80px] flex items-center justify-start px-[30px] gap-[10px] cursor-pointer" >
                     <img className="w-[40px]" src={logo} alt="" />
                     <h1 className="text-[22px] font-sans">One Cart</h1>
                 </div>
                <div className="w-[100%] h-[100px] flex items-center justify-center flex-col gap-[10px]">
                  <span className="text-[25px] font-semibold">Login Page</span>
                  <span className="text-[16px]">Welcome to OneCart, Apply to Admin Login</span>
                </div>
                <div className="max-w-[600px] w-[90%] h-[400px] bg-[#00000025] border-[1px] border-[#96969635] backdrop:blur-2xl rounded-lg shadow-lg flex items-center justify-center">
                       <form onSubmit={AdminLogin} className=" w-[90%] h-[90%] flex flex-col items-center " action="">
                           
                           
              <div className="w-[90%] h-[400px] flex flex-col items-center justify-center gap-[15px] relative">
                 
                 <input type="text" className="w-[100%] h-[50px] border-[2px] border-[#96969635] backdrop-blur-sm rounded-lg shadow-lg bg-transparent placeholder-[#ffffffc7] px-[20px] font-semibold " placeholder="Email" onChange={(e)=>{setEmail(e.target.value)}} value={email} required />
                 <input type={show?"text":"password"} className="w-[100%] h-[50px] border-[2px] border-[#96969635] backdrop-blur-sm rounded-lg shadow-lg bg-transparent placeholder-[#ffffffc7] px-[20px] font-semibold " placeholder="Password" onChange={(e)=>{setPassword(e.target.value)}} value={password} required />
                 {!show && <IoEyeOutline className="w-[20px] h-[20px] absolute right-[5%] bottom-[50%]" onClick={()=>{setShow(prev => !prev)}}/>}
                 {show && <IoEye className="w-[20px] h-[20px] absolute right-[5%] bottom-[50%]"  onClick={()=>{setShow(prev => !prev)}} />}
                 <button className="w-[100%] h-[50px] bg-[#6060f5] rounded-lg flex items-center justify-center mt-[20px] text-[17px] font-semibold">{loading?<Loading />:"Login"}</button>
                
              </div>
         
         
                       </form>
                </div>
             </div>
    
  )
}

export default Login
