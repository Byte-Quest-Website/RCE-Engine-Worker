import { join } from "path";
import { readFileSync } from "fs";
import { connect } from "amqplib";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";

const QUEUE_NAME = "test_code";
const REPLY_QUEUE = "amq.rabbitmq.reply-to";

async function sendMessages() {
    const connection = await connect("amqp://localhost");
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: false });

    let responseEmitter = new EventEmitter();
    responseEmitter.setMaxListeners(0);

    channel.consume(
        REPLY_QUEUE,
        (msg) => {
            if (!msg) {
                return;
            }
            responseEmitter.emit(
                msg.properties.correlationId,
                msg.content.toString("utf8")
            );
        },
        { noAck: true }
    );

    let tcodeCode = readFileSync(join(__dirname, "test.py")).toString();
    let tdataCode = readFileSync(join(__dirname, "data.json")).toString();
    let msg = JSON.stringify({
        jobID: uuidv4(),
        code: tcodeCode,
        data: tdataCode,
        replyBack: true,
    });
    let res: string = await new Promise((resolve) => {
        const correlationId = uuidv4();
        responseEmitter.once(correlationId, resolve);
        channel.sendToQueue(QUEUE_NAME, Buffer.from(msg), {
            correlationId,
            replyTo: REPLY_QUEUE,
            persistent: true,
        });
    });

    console.log("Response", JSON.parse(JSON.parse(res)["stdout"]));

    setTimeout(() => connection.close(), 1000);
}

sendMessages();
