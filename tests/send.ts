import { join } from "path";
import { readFileSync } from "fs";
import { connect } from "amqplib";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";

const QUEUE_NAME = "run_code";
const REPLY_QUEUE = "amq.rabbitmq.reply-to";

async function sendMessages() {
    const connection = await connect("amqp://localhost");
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: false });

    const channel2 = await connection.createChannel();
    await channel2.assertQueue("test_code", { durable: false });

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

    channel2.consume(
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

    let inputString = readFileSync(join(__dirname, "input.txt")).toString();

    let pythonCode = readFileSync(join(__dirname, "code.py")).toString();
    let msg1 = JSON.stringify({
        jobID: uuidv4(),
        language: "python",
        code: pythonCode,
        input: inputString,
        replyBack: true,
    });
    let res1 = await new Promise((resolve) => {
        const correlationId = uuidv4();
        responseEmitter.once(correlationId, resolve);
        channel.sendToQueue(QUEUE_NAME, Buffer.from(msg1), {
            correlationId,
            replyTo: REPLY_QUEUE,
            persistent: true,
        });
    });
    console.log("Response", res1);

    let ricklangCode = readFileSync(
        join(__dirname, "code.rickroll")
    ).toString();
    let msg2 = JSON.stringify({
        jobID: uuidv4(),
        language: "ricklang",
        code: ricklangCode,
        input: inputString,
        replyBack: true,
    });
    let res2 = await new Promise((resolve) => {
        const correlationId = uuidv4();
        responseEmitter.once(correlationId, resolve);
        channel.sendToQueue(QUEUE_NAME, Buffer.from(msg2), {
            correlationId,
            replyTo: REPLY_QUEUE,
            persistent: true,
        });
    });
    console.log("Response", res2);

    let nodeCode = readFileSync(join(__dirname, "code.js")).toString();
    let msg3 = JSON.stringify({
        jobID: uuidv4(),
        language: "node",
        code: nodeCode,
        input: inputString,
        replyBack: true,
    });
    let res3 = await new Promise((resolve) => {
        const correlationId = uuidv4();
        responseEmitter.once(correlationId, resolve);
        channel.sendToQueue(QUEUE_NAME, Buffer.from(msg3), {
            correlationId,
            replyTo: REPLY_QUEUE,
            persistent: true,
        });
    });
    console.log("Response", res3);

    let cCode = readFileSync(join(__dirname, "code.c")).toString();
    let msg4 = JSON.stringify({
        jobID: uuidv4(),
        language: "c",
        code: cCode,
        input: inputString,
        replyBack: true,
    });
    let res4: string = await new Promise((resolve) => {
        const correlationId = uuidv4();
        responseEmitter.once(correlationId, resolve);
        channel.sendToQueue(QUEUE_NAME, Buffer.from(msg4), {
            correlationId,
            replyTo: REPLY_QUEUE,
            persistent: true,
        });
    });
    console.log("Response", res4);

    let tcodeCode = readFileSync(join(__dirname, "test.py")).toString();
    let tdataCode = readFileSync(join(__dirname, "data.json")).toString();
    let msg5 = JSON.stringify({
        jobID: uuidv4(),
        code: tcodeCode,
        data: tdataCode,
        replyBack: true,
    });
    let res5: string = await new Promise((resolve) => {
        const correlationId = uuidv4();
        responseEmitter.once(correlationId, resolve);
        channel2.sendToQueue("test_code", Buffer.from(msg5), {
            correlationId,
            replyTo: REPLY_QUEUE,
            persistent: true,
        });
    });
    console.log("Response", res5);

    console.log("Sent All Messages");
    setTimeout(() => connection.close(), 1000);
}

sendMessages();
