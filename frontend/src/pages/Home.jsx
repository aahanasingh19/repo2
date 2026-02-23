import React ,{useEffect, useState} from "react";

import Background from "../components/Background.jsx";
import Hero from "../components/Hero.jsx"
import Product from "./Product.jsx";
import OurPolicy from "../components/OurPolicy.jsx";
import NewLetterBox from "../components/NewLetterBox.jsx";
import Footer from "../components/Footer.jsx"

function Home(){
    let heroData=[
{text1:"30% OFF Limited Offer", text2:"Style that"},
{text1:"Discover the Best of Bold Fashion", text2:"Limited Time Only!"},
{text1:"Explore Our Best Collection ", text2:"Shop Now!"},
{text1:"Choose your Perfect Fasion Fit", text2:"Now on Sale!"}
    ]

    useEffect(()=>{
        let interval=setInterval(()=>{
          setHeroCount(prevCount=>(prevCount==3?0:prevCount+1))
        },3000);
        return ()=> clearInterval(interval)

        
    },[])
  

    let [heroCount,setHeroCount]=useState(0)

    return <div className="overflow-x-hidden relative top-[70px] ">
    
    <div className="w-[100vw] lg:h-[100vh] md:h-[50vh] sm-:h-[30vh] h-[100vh] bg-gradient-to-l from-[#141414] to-[#0c2025]">
      
     <Background heroCount={heroCount}></Background>
     <Hero  heroCount={heroCount} setHeroCount={setHeroCount} heroData={heroData[0]}/>
    </div>
    <Product />
    <OurPolicy/>
    <NewLetterBox/>
    <Footer/>
    </div>
}
export default Home