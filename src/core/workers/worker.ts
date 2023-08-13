import { createClient } from "redis";
import { connect, type Connection, type Channel } from "amqplib";
import { createLogger, transports, format, type Logger } from "winston";

import { type IWorker } from "../helpers/types";

export class Worker implements IWorker {
    readonly queueName: string;
    readonly connection: Connection;
    readonly channel: Channel;
    readonly logger: Logger;
    readonly redis: ReturnType<typeof createClient>;

    constructor(
        queueName: string,
        connection: Connection,
        channel: Channel,
        logger: Logger,
        redis: ReturnType<typeof createClient>
    ) {
        this.queueName = queueName;
        this.connection = connection;
        this.channel = channel;
        this.logger = logger;
        this.redis = redis;
    }

    static async init<T extends Worker>(queueName: string): Promise<T> {
        const connection = await connect("amqp://localhost");

        const channel = await connection.createChannel();
        await channel.assertQueue(queueName, { durable: false });

        const redisClient = createClient({ url: process.env.REDIS_URL });
        await redisClient.connect();

        const logger = createLogger({
            format: format.combine(format.timestamp(), format.prettyPrint()),
            transports: [
                new transports.Console(),
                new transports.File({ filename: "worker.log" }),
            ],
        });

        logger.info("Worker Waiting For Messages!");

        return new this(
            queueName,
            connection,
            channel,
            logger,
            redisClient
        ) as T;
    }
}
