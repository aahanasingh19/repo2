import express from "express"
import dotenv from "dotenv"
import connectDb from "./config/db.js"
import cookieParser from "cookie-parser"
import authRoutes from "./routes/authRoutes.js"
import bodyParser from "body-parser";
import cors from "cors"
import userRoutes from "./routes/userRoutes.js"
import productRoutes from "./routes/productRoutes.js"
import cartRoutes from "./routes/cartRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"
import { connectRabbitMQ } from "./config/rabbitmq.js"
dotenv.config()
let port = process.env.PORT || 6000

let app=express()

app.set("trust proxy", 1);

app.use(express.json())


app.use(bodyParser.urlencoded({extended:true}))
app.use(cookieParser())

app.use(cors({
    origin:true,
    credentials:true
}))


app.use("/api/auth",authRoutes)
app.use("/api/user",userRoutes)
app.use("/api/products",productRoutes)
app.use("/api/cart",cartRoutes)
app.use("/api/order",orderRoutes)

app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});


const startServer=async()=>{        

    try{
        connectDb()
        connectRabbitMQ()
        app.listen(port,"0.0.0.0",()=>{
            console.log(`server is started on port ${port}`)
        })
        

    }catch(err){
        console.log(err)
    }
}

startServer()



