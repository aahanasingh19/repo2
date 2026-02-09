import amqp from "amqplib"
import sendEmail from "../utils/sendEmail.js"

const sleep = (ms) => new Promise(res => setTimeout(res, ms))

async function startWorker(retries = 10) {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL)
    const channel = await connection.createChannel()

    const exchange = "order.direct"
    const routingKey = "order.created"
    const queue = "email.queue"

    await channel.assertExchange(exchange, "direct", { durable: true })
    await channel.assertExchange("email.dlx", "direct", { durable: true })
     await channel.assertQueue("email.queue", {
      durable: true,
      deadLetterExchange: "email.dlx",
      deadLetterRoutingKey: "email.failed"
    })

    await channel.assertQueue("email.dlq", { durable: true })

    await channel.bindQueue(queue, exchange, routingKey)
    await channel.bindQueue("email.dlq", "email.dlx", "email.failed")

    channel.prefetch(1)
   
    console.log("📧 Email worker started (DLQ enabled)")




    channel.consume(queue, async (msg) => {
      if (!msg) return

      try {
        const data = JSON.parse(msg.content.toString())

      

        await sendEmail({
          to: data.email,
          subject: "Order Confirmation - OneCart",
          html: `<p>Order ${data.orderId} confirmed</p>`
        })

        channel.ack(msg)

      } catch (err) {
        console.error("Email failed", err)
        channel.nack(msg, false, false) // TEMP (we improve below)  
      }
    })

  } catch (err) {
    console.log("RabbitMQ not ready, retrying...", retries)
    if (retries === 0) throw err
    await sleep(3000)
    return startWorker(retries - 1)
  }
}

startWorker()
