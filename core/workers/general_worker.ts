import { file } from "tmp-promise"
import { join } from "path"
import { promises as fs } from 'fs';
import { connect, type Connection, type Channel } from "amqplib";
import { createLogger, transports, format, type Logger } from "winston";


import {
    type IGeneralRCEWorker,
    RunCodeJob,
    RunCodeJobValidator,
} from "../helpers/types";
import { buildImage, imageExists, runCodeInContainer, cleanup } from "../helpers/docker";
import { Languages } from "../helpers/constants";

export class GeneralRCEWorker implements IGeneralRCEWorker {
    readonly queueName: string;
    readonly connection: Connection;
    readonly channel: Channel;
    readonly logger: Logger;

    constructor(
        queueName: string,
        connection: Connection,
        channel: Channel,
        logger: Logger
    ) {
        this.queueName = queueName;
        this.connection = connection;
        this.channel = channel;
        this.logger = logger;
    }

    static async init(queueName: string): Promise<GeneralRCEWorker> {
        const connection = await connect("amqp://localhost");

        const channel = await connection.createChannel();
        await channel.assertQueue(queueName, { durable: false });

        const logger = createLogger({
            format: format.combine(format.timestamp(), format.prettyPrint()),
            transports: [
                new transports.Console(),
                new transports.File({ filename: "worker.log" }),
            ],
        });

        logger.info("Worker Waiting For Messages!");

        return new GeneralRCEWorker(queueName, connection, channel, logger);
    }

    async start(): Promise<void> {
        this.logger.info("Worker Consuming Messages!");

        this.channel.consume(
            this.queueName,
            (msg) => {
                if (msg === null) {
                    return;
                }

                let parsed = RunCodeJobValidator.safeParse(
                    JSON.parse(msg.content.toString())
                );

                if (!parsed.success) {
                    return this.channel.ack(msg);
                }
                let job: RunCodeJob = parsed.data;
                this.logger.info(`Recieved Task: ${job.jobID}`);

                this.processJob(job, () => {
                    this.logger.info(`Completed Task: ${job.jobID}`);
                    this.channel.ack(msg);
                });
            },
            { noAck: false }
        );
    }

    async processJob(job: RunCodeJob, callback: () => any) {
        const { path, imageName, fileName, runScript } = Languages[job.language]

        if (!await imageExists(imageName)) {
            await buildImage(imageName, job.language)
        }

        const codeFile = await file();
        const inputFile = await file();


        await fs.writeFile(inputFile.path, job.input, "utf-8")
        await fs.writeFile(codeFile.path, job.code, "utf-8")

        const containerName = `${job.jobID}_${job.language}_${imageName}`

        console.log(await runCodeInContainer({ inputFileSrc: inputFile.path, codeFileSrc: codeFile.path, codeFileDes: fileName, runFileSrc: join(path, "run.sh"), runFileDes: runScript, imageName: imageName, containerName: containerName }))

        codeFile.cleanup()
        inputFile.cleanup();

        cleanup(containerName)
        return callback()
    }
}
