import { connect, type Connection, type Channel } from "amqplib";
import { createLogger, transports, format, type Logger } from "winston";

import { type IGeneralRCEWorker, RunCodeJob } from "../helpers/types"

export class GeneralRCEWorker implements IGeneralRCEWorker {
    readonly queueName: string;
    readonly connection: Connection;
    readonly channel: Channel;
    readonly logger: Logger

    constructor(queueName: string, connection: Connection, channel: Channel, logger: Logger) {
        this.queueName = queueName;
        this.connection = connection;
        this.channel = channel;
        this.logger = logger;
    }

    static async init(queueName: string): Promise<GeneralRCEWorker> {
        const connection = await connect("amqp://localhost")

        const channel = await connection.createChannel()
        await channel.assertQueue(queueName, { durable: false })

        const logger = createLogger({
            format: format.combine(
                format.timestamp(),
                format.prettyPrint()
            ),
            transports: [
                new transports.Console(),
                new transports.File({ filename: 'worker.log' })
            ]
        });

        logger.info("Worker Waiting For Messages!")

        return new GeneralRCEWorker(queueName, connection, channel, logger)
    }

    async start(): Promise<void> {
        this.logger.info("Worker Consuming Messages!")

        this.channel.consume(this.queueName, msg => {
            if (msg === null) {
                return;
            }

            let parsed = RunCodeJob.safeParse(JSON.parse(msg.content.toString()))
            if (!parsed.success) {
                return this.channel.ack(msg)
            }

            let job = parsed.data
            this.logger.info("Recieved JSON Payload!", { jsonRecieved: job })

            // pretending to do work
            setTimeout(() => { this.logger.info(`Completed Task: ${job.jobID}`); this.channel.ack(msg) }, 4000)
        }, { noAck: false })
    }
}