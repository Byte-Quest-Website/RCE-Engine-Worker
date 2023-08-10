import { connect } from "amqplib";
import { v4 as uuidv4 } from "uuid";
import { readFileSync } from "fs";

const QUEUE_NAME = "run_code";

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

async function sendMessages() {
    const connection = await connect("amqp://localhost");
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: false });

    let data = readFileSync(
        "/Users/sid/Desktop/Coding/Other/Programming-Problem-Website/RCE-Engine-Worker/tests/code.py"
    ).toString();
    let inp = readFileSync(
        "/Users/sid/Desktop/Coding/Other/Programming-Problem-Website/RCE-Engine-Worker/tests/input.txt"
    ).toString();

    for (let i = 0; i < 2; i++) {
        // let options: string[] = [`print("EEE ${uuidv4()}")`, "__import__('time').sleep(5)", "while True: pass", "print('hello world')", "print(", "def e(): e()\ne()", "[_ for _ in range(1000000000)]"]
        // let msg = JSON.stringify({ jobID: uuidv4(), language: "python", code: options[Math.floor(Math.random() * options.length)], input: inp })
        let msg = JSON.stringify({
            jobID: uuidv4(),
            language: "python",
            code: data,
            input: inp,
        });
        channel.sendToQueue(QUEUE_NAME, Buffer.from(msg), { persistent: true });
    }

    console.log("Sent Message");
    setTimeout(() => connection.close(), 1000);
}

sendMessages();
