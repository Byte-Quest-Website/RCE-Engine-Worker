import { connect } from "amqplib";

const QUEUE_NAME = "run_code"

async function sendMessages() {
    const connection = await connect("amqp://localhost")
    const channel = await connection.createChannel()

    await channel.assertQueue(QUEUE_NAME, { durable: false })

    for (let i = 0; i < 10; i++) {
        let msg = JSON.stringify({ message: "Hello World!", messageId: i })

        channel.sendToQueue(QUEUE_NAME, Buffer.from(msg), { persistent: true })
        console.log("Sent Message", i)

        // sleep 1 sec
        await new Promise(f => setTimeout(f, 1000));
    }

    console.log("Sent all messages to queue!")

    connection.close()
}

sendMessages()