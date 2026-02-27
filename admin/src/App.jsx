import React from 'react'
import {Route ,Routes} from "react-router-dom"
import Home from './pages/Home'
import Add from "./pages/Add"
import Lists from "./pages/Lists"
import Orders from "./pages/Orders"
import Login from "./pages/Login"
import { adminDataContext } from './context/UserContext'
import { useContext } from 'react'
import {ToastContainer,toast} from "react-toastify"



function App() {
  let{adminData}=useContext(adminDataContext)
  return ( <> {!adminData ?<Login/> :
  
  <>
  <ToastContainer></ToastContainer>
      <Routes> 
        <Route path="/" element={<Home />}></Route>
        <Route path="/add" element={<Add/>}></Route>
        <Route path="/list" element={<Lists />}></Route>
        <Route path="/orders" element={<Orders/>}></Route>
        <Route path="/login" element={<Login />}></Route>
      </Routes>
    </>
}
    </>
  )
}

export default App

//dfasfasdfas