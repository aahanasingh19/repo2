import React from "react"
import { Routes,Route } from "react-router-dom"
import Registration from "./pages/Registration"
import { useLocation } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Collections from "./pages/Collections.jsx"
import Product from "./pages/Product.jsx"
import About from "./pages/About.jsx"
import Contact from "./pages/Contact.jsx"
import Nav from "./components/Nav"
import { UserDataContext } from "../context/UserContext"
import { useContext } from "react"
import { Navigate } from "react-router-dom"
import ProductDetail from "./pages/ProductDetail.jsx"
import Cart from "./pages/Cart.jsx"
import PlaceOrder from "./pages/PlaceOrder.jsx"
import Order from "./pages/Order.jsx"
import {ToastContainer} from "react-toastify"
import NotFound from "./pages/NotFound.jsx"
import Ai from "./components/Ai.jsx"


function App(){
  let {userData}=useContext(UserDataContext)
  let location=useLocation()
  return <div>
<ToastContainer/>
      {userData &&  <Nav/>}
  <Routes>
       <Route path="/login" element={userData ? (<Navigate to={location.state?.from || "/"} />):<Login/> }/> 
    <Route path="/signup" element={userData ? (<Navigate to={location.state?.from || "/" }/>): <Registration />} />
    <Route path="/" element={userData ? <Home /> : <Navigate to ="/login" state={{from:location.pathname}} /> } />
 
    <Route path="/about" element={userData ? <About /> : <Navigate to ="/login" state={{from:location.pathname}} /> } />
    <Route path="/collection" element={userData ? <Collections /> : <Navigate to ="/login" state={{from:location.pathname}} /> } />
    <Route path="/product" element={userData ? <Product /> : <Navigate to ="/login" state={{from:location.pathname}} /> } />
    <Route path="/contact" element={userData ? <Contact /> : <Navigate to ="/login" state={{from:location.pathname}} /> }></Route>
    <Route path="/productdetail/:productId" element={userData ? <ProductDetail /> : <Navigate to ="/login" state={{from:location.pathname}} /> }></Route>
    <Route path="/cart" element={userData ? <Cart/> : <Navigate to ="/login" state={{from:location.pathname}} /> }></Route>
    <Route path="/placeorder" element={userData ? <PlaceOrder/> : <Navigate to ="/login" state={{from:location.pathname}} /> }></Route>
    <Route path="/order" element={userData ? <Order/> : <Navigate to ="/login" state={{from:location.pathname}} /> }></Route>
    <Route path="*" element= {<NotFound/>} /></Routes>
<Ai/>
  

</div>
  
}


export default App  