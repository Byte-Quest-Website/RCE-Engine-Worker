import { join } from "path";
import { readFileSync } from "fs";
import { connect } from "amqplib";
import { v4 as uuidv4 } from "uuid";

const QUEUE_NAME = "run_code";

async function sendMessages() {
    const connection = await connect("amqp://localhost");
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: false });

    let pythonCode = readFileSync(join(__dirname, "code.py")).toString();
    let ricklangCode = readFileSync(
        join(__dirname, "code.rickroll")
    ).toString();
    let inputString = readFileSync(join(__dirname, "input.txt")).toString();

    let msg1 = JSON.stringify({
        jobID: uuidv4(),
        language: "python",
        code: pythonCode,
        input: inputString,
    });
    channel.sendToQueue(QUEUE_NAME, Buffer.from(msg1), { persistent: true });

    let msg2 = JSON.stringify({
        jobID: uuidv4(),
        language: "ricklang",
        code: ricklangCode,
        input: inputString,
    });
    channel.sendToQueue(QUEUE_NAME, Buffer.from(msg2), { persistent: true });

    console.log("Sent All Messages");
    setTimeout(() => connection.close(), 1000);
}

sendMessages();
