import { connect, type Connection, type Channel } from "amqplib";

import { type IGeneralRCEWorker } from "@types"

export class GeneralRCEWorker implements IGeneralRCEWorker {
    readonly queueName: string;
    readonly connection: Connection;
    readonly channel: Channel;

    constructor(queueName: string, connection: Connection, channel: Channel) {
        this.queueName = queueName;
        this.connection = connection;
        this.channel = channel;
    }

    static async init(queueName: string): Promise<GeneralRCEWorker> {
        const connection = await connect("amqp://localhost")
        const channel = await connection.createChannel()
        await channel.assertQueue(queueName, { durable: false })

        return new GeneralRCEWorker(queueName, connection, channel)
    }

    async start(): Promise<void> {
        this.channel.consume(this.queueName, msg => {
            if (msg === null) {
                return;
            }

            let payload;
            try {
                payload = JSON.parse(msg.content.toString())
            } catch (error) {
                return this.channel.ack(msg)
            }

            console.log("Recieved:", payload)

            setTimeout(() => { console.log("Done!"); this.channel.ack(msg) }, 4000)
        }, { noAck: false })
    }
}