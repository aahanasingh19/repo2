 import Order from "../model/orderModel.js"
 import User from  "../model/userModel.js" 
 import IdempotencyKey from "../model/idempotencyModel.js"
 import OutboxEvent from "../model/outboxModel.js"
 import razorpay from "razorpay"
 import crypto from "crypto"
 import dotenv from "dotenv"
 import { getChannel } from "../config/rabbitmq.js"
 dotenv.config()

 const razorpayInstance=new razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET
 })


 const currency="inr"

 /**
  * Generate a deterministic idempotency key from request data.
  * Falls back to crypto.randomUUID() if no identifier is available.
  */
 const generateIdempotencyKey = (identifier) => {
   if (!identifier) return crypto.randomUUID()
   return crypto.createHash("sha256").update(identifier).digest("hex")
 }

 /**
  * Check if an idempotency key has already been processed.
  * Returns the cached response if found, null otherwise.
  */
 const checkIdempotency = async (key) => {
   const existing = await IdempotencyKey.findOne({ key })
   return existing
 }

 /**
  * Store a processed idempotency key (auto-expires via TTL index after 24h).
  */
 const storeIdempotencyKey = async (key, statusCode, response) => {
   await IdempotencyKey.create({ key, statusCode, response })
 }
 
 export const placeOrder=async(req,res)=>{
    try{
        const {items,amount,address}=req.body
        console.log("place order called")
        const userId=req.userId

        // ── Idempotency check ──
        const idempotencyKey = req.headers["x-idempotency-key"] || generateIdempotencyKey(`${userId}-${Date.now()}`)
        const cached = await checkIdempotency(idempotencyKey)
        if (cached) {
          console.log(`⚡ Idempotent hit for key: ${idempotencyKey}`)
          return res.status(cached.statusCode).json(cached.response)
        }

        const orderData={
            items,
            amount,
            userId,
            address,
            paymentMethod:"COD",
            payment:false,
            date:Date.now(),
            idempotencyKey
        }


        const newOrder=new Order(orderData) 
        await newOrder.save()
        await User.findByIdAndUpdate(userId,{cartData:{}})

        // ── Outbox: insert event as PENDING ──
        await OutboxEvent.create({
          aggregateId: newOrder._id.toString(),
          eventType: "ORDER_CREATED",
          payload: {
            orderId: newOrder._id,
            userId: orderData.userId,
            email: orderData.address.email,
            amount: orderData.amount
          },
          status: "PENDING"
        })

        // ── Publish to RabbitMQ (best-effort, outbox poller is the safety net) ──
        try {
          const channel = getChannel()
          const routingKey="order.created"
          const exchange="order.direct"
           channel.publish(exchange,routingKey,Buffer.from(JSON.stringify({
              orderId:newOrder._id,
              userId:orderData.userId,
              email:orderData.address.email,
              amount:orderData.amount
           })),{ persistent: true })
        } catch (mqErr) {
          console.warn("⚠️  RabbitMQ publish failed (outbox poller will retry):", mqErr.message)
        }

        const responseBody = { message: "Order Place", orderId: newOrder._id }

        // ── Store idempotency key (24h TTL) ──
        await storeIdempotencyKey(idempotencyKey, 201, responseBody)

        return res.status(201).json(responseBody)

    }catch(error){
        console.log(error)
        res.status(500).json({message:"Order Place error"})
    }
 }


 export const userOrders=async(req,res)=>{
    try{
        const userId=req.userId
        const orders=await Order.find({userId})
        return res.status(200).json(orders)

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"userOrders error"})
    }
 }


 export const allOrders=async(req,res)=>{
    try{
        const orders=await Order.find({})
        res.status(200).json(orders)

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"adminAll Orders error"})
    }
 }

 export const updateStatus=async (req,res)=>{
    try{
        
        const {orderId,status}=req.body
 
        
          await Order.findByIdAndUpdate(orderId , { status })
        await res.status(201).json({message:"Status Updated"})

    }catch(error){
                   return res.status(500).json({message:error.message})
    }
 }


 export const placeOrderRazorpay=async(req,res)=>{
 
  
    
    try{
        const {items,amount,address}=req.body
        const userId=req.userId

        // ── Idempotency check ──
        const idempotencyKey = req.headers["x-idempotency-key"] || generateIdempotencyKey(`razorpay-${userId}-${amount}-${Date.now()}`)
        const cached = await checkIdempotency(idempotencyKey)
        if (cached) {
          console.log(`⚡ Idempotent hit for Razorpay order: ${idempotencyKey}`)
          return res.status(cached.statusCode).json(cached.response)
        }

        const orderData={
            items,
            amount,
            userId,
            address,
            paymentMethod:"Razorpay",
            payment:false,
            date:Date.now(),
            idempotencyKey
        }
        const newOrder=new Order(orderData)
        await newOrder.save()

        const options={
            amount:amount*100,
            currency:currency.toUpperCase(),
            receipt:newOrder._id.toString()
        }
        
         razorpayInstance.orders.create(options,(error,order)=>{
            if(error){
                console.log(error)
                return res.status(500).json(error)
            }
            else{
                // Store idempotency key
                storeIdempotencyKey(idempotencyKey, 200, order).catch(err =>
                  console.warn("Failed to store idempotency key:", err.message)
                )
                res.status(200).json(order)
            }
        })


    }catch(error){
            res.status(500).json({message:error.message})
    }
 }

 export const verifyRazorpay=async(req,res)=>{
    try{
        const userId=req.userId
        const {razorpay_order_id}=req.body

        // ── Idempotency: derive key from razorpay_order_id (deterministic) ──
        const idempotencyKey = generateIdempotencyKey(`verify-${razorpay_order_id}`)
        const cached = await checkIdempotency(idempotencyKey)
        if (cached) {
          console.log(`⚡ Idempotent hit for verify: ${idempotencyKey}`)
          return res.status(cached.statusCode).json(cached.response)
        }

        const orderInfo=await razorpayInstance.orders.fetch(razorpay_order_id)
       
        if(orderInfo.status==="paid"){
             const orderId=orderInfo.receipt

            // ── Outbox: insert PENDING event BEFORE processing ──
            const outboxEvent = await OutboxEvent.create({
              aggregateId: orderId,
              eventType: "PAYMENT_VERIFIED",
              payload: {
                razorpay_order_id,
                orderId,
                userId
              },
              status: "PENDING"
            })

            await User.findByIdAndUpdate(userId,{cartData:{}})
            const order = await Order.findByIdAndUpdate(orderId,{payment:true},{new:true})

            // ── Publish to RabbitMQ (best-effort) ──
            try {
              const channel = getChannel()
              const exchange = "order.direct"
              const routingKey = "order.created"

              channel.publish(
                exchange,
                routingKey,
                Buffer.from(JSON.stringify({
                  orderId: order._id,
                  userId: order.userId,
                  email: order.address.email,
                  amount: order.amount
                })),
                { persistent: true }
              )

              // Also publish to payment processing queue
              channel.publish(
                exchange,
                "payment.process",
                Buffer.from(JSON.stringify({
                  orderId: order._id,
                  razorpay_order_id,
                  userId: order.userId,
                  amount: order.amount,
                  status: "paid"
                })),
                { persistent: true }
              )
            } catch (mqErr) {
              console.warn("⚠️  RabbitMQ publish failed (outbox poller will retry):", mqErr.message)
            }

            // ── Mark outbox event as PROCESSED ──
            await OutboxEvent.findByIdAndUpdate(outboxEvent._id, {
              status: "PROCESSED",
              processedAt: new Date()
            })

            const responseBody = { message: "Payment successfull" }

            // ── Store idempotency key ──
            await storeIdempotencyKey(idempotencyKey, 200, responseBody)

            res.status(200).json(responseBody)
            
        }
        else{
            res.json({message:"payment failed"})
        }
    }catch(error){
        console.log(error)
        res.status(500).json({message:error.message})
    }
 }