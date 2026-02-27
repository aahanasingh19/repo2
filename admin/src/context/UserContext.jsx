import {useState} from 'react'
import { createContext } from 'react'
import { authDataContext } from './AuthContext'
import { useEffect } from 'react'
import { useContext } from 'react'
import axios from "axios"


export const adminDataContext=createContext()
function AdminContext({children}) {

    let[adminData,setAdminData]= useState(null)
    let {serverUrl}=useContext(authDataContext)

    const getAdmin=async()=>{
        
        try{
        let result=await axios.get("/api/user/getadmin",{withCredentials:true})
        setAdminData(result.data)
    }catch(error){
                setAdminData(null)
                console.log(error)
    }
}

useEffect(()=>{
    getAdmin()
},[])
    let value={
          adminData,setAdminData,getAdmin
    }
    
  return (
    <div>
      <adminDataContext.Provider value={value}>
        {children}
      </adminDataContext.Provider>
    </div>
  )
}

export default AdminContext

