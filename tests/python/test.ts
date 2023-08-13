import { join } from "path";
import { readFileSync, readdir } from "fs";
import { connect } from "amqplib";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";

const QUEUE_NAME = "run_code";
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

    let files: string[] = await new Promise((resolve) => {
        readdir(__dirname, (err, files) => {
            resolve(files);
        });
    });

    let inputString = readFileSync(join(__dirname, "input.txt")).toString();

    await Promise.all(
        files.map(async (file) => {
            if (file.endsWith(".py")) {
                let code = readFileSync(join(__dirname, file)).toString();
                let msg = JSON.stringify({
                    jobID: uuidv4(),
                    language: "python",
                    code: code,
                    input: inputString,
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
                console.log("Response", JSON.parse(res));
            }
        })
    );

    setTimeout(() => connection.close(), 1000);
}

sendMessages();
