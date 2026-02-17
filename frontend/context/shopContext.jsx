import React,{createContext} from "react"
import { authDataContext } from "./AuthContext.jsx"
import { useEffect } from "react"
import {useState} from "react"
import { useContext } from "react"
import axios from "axios"
import { UserDataContext } from "./UserContext"
import { toast } from 'react-toastify';


export const shopDataContext =createContext()

function ShopContext({children}){
    let [products ,setProducts]=useState([])
    let {serverUrl} =useContext(authDataContext)
    let {userData}=useContext(UserDataContext)
    let currency = "₹"
    let delivery_fee=40
    let [search,setSearch]=useState("")
    let[showSearch,setShowSearch]=useState(false)
    let [cartItem,setCartItem]=useState({})
    let[loading,setLoading]=useState(false)
  
const addtoCart=async(itemId,size)=>{
    setLoading(true)
                if(!size){
                    console.log("select product size")
                    return ;
                }
              
    let cartData=structuredClone(cartItem);

    if(cartData[itemId]){
        if(cartData[itemId][size]){
            cartData[itemId][size]++;
        }
        else{
            cartData[itemId][size]=1
        }
    }else{
        cartData[itemId]={};
        cartData[itemId][size]=1

    }
    setCartItem(cartData)


    if(userData){
    
        try{    
          let result=  await axios.post("/api/cart/add" ,{itemId,size},{withCredentials:true})
            console.log(result.data)
            setLoading(false)
        }catch(error){
            setLoading(false)
              console.log(error.message)
              
        }
    }

}

const getCartCount=()=>{
   
    let totalCount=0;
    for(const items in cartItem){
        for(const item in cartItem[items]){
            try{
                if(cartItem[items][item]>0){
                    totalCount+=cartItem[items][item]
                }
            }catch(error){
                 
            }
        }
    }
    return totalCount
}

const getUserCart=async()=>{
    try{
        const result =await axios.post("/api/cart/get",{},{withCredentials:true})
        console.log(result)
        console.log(result.data)
        setCartItem(result.data)
    }catch(error){
        console.log(error)
        toast.error(error.message)
    }
}


const updateQuantity=async(itemId,size,quantity)=>{
    
    let cartData=structuredClone(cartItem)
    cartData[itemId][size]=quantity

    setCartItem(cartData)
    if(userData){
        try{

            await axios.post("/api/cart/update",{itemId,size,quantity},{withCredentials:true})

        }catch(error){
            console.log(error.message)
            
        }
    }

}


   

    const getProducts=async ()=>{
        try{
                let result =await axios.get(`/api/products/list`)
                console.log(result.data )
                setProducts(result.data)
        }catch(error){
                   console.log(error)
        }
    }



const getCartAmount=()=>{
    let totalAmount=0;
    for(const items in cartItem){
        let itemInfo=products.find((product)=>product._id===items)
        for(const size in cartItem[items]){
            try{
                if(cartItem[items][size]>0){
              
                            totalAmount+=itemInfo.price*cartItem[items][size];
                        }
                    }catch(error){

                    }
                }
            }
            return totalAmount
        }
    


    useEffect(()=>{
        getProducts()
    },[])

    useEffect(()=>{
      getUserCart()  
    },[])

    

      

    let value={
        products,currency,delivery_fee,getProducts ,search,setSearch,showSearch,setShowSearch,cartItem,addtoCart,getCartCount,setCartItem,updateQuantity,getCartAmount,loading
    }
    return(
           <div>
            <shopDataContext.Provider value={value}>
            {children}
            </shopDataContext.Provider>
           </div>
    )
}

export default ShopContext
