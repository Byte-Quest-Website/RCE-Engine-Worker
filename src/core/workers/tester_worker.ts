import { file } from "tmp-promise";
import { promises as fs } from "fs";

import { Worker } from "./worker";
import {
    ContainerResponse,
    TestCodeJob,
    TestCodeJobValidator,
    IWorker,
    TestCodeData,
} from "../helpers/types";
import { TestCodeInContainer, cleanup } from "../helpers/docker";

export class TestCodeWorker extends Worker implements IWorker {
    async start(): Promise<void> {
        this.logger.info("Worker Consuming Messages!");

        await this.channel.prefetch(3);

        this.channel.consume(
            this.queueName,
            async (msg) => {
                if (msg === null) {
                    return;
                }

                let parsed = TestCodeJobValidator.safeParse(
                    JSON.parse(msg.content.toString())
                );
                if (!parsed.success) {
                    return this.channel.ack(msg);
                }

                let job: TestCodeJob = parsed.data;

                await this.redis.set(`${job.jobID}-status`, "processing");
                this.logger.info(`Recieved Task: ${job.jobID}`);

                this.processJob(job, async (response) => {
                    this.logger.info(`Completed Task: ${job.jobID}`);
                    await this.redis.set(`${job.jobID}-status`, "complete");

                    if (job.replyBack) {
                        this.channel.sendToQueue(
                            msg.properties.replyTo,
                            Buffer.from(JSON.stringify(response)),
                            {
                                correlationId: msg.properties.correlationId,
                            }
                        );
                    }

                    this.channel.ack(msg);
                });
            },
            { noAck: false }
        );
    }
    async processJob(
        job: TestCodeJob,
        callback: (response: ContainerResponse) => any
    ) {
        const codeFile = await file();
        const dataFile = await file();

        await fs.writeFile(dataFile.path, job.data, "utf-8");
        await fs.writeFile(codeFile.path, job.code, "utf-8");

        const containerName = `python_${job.jobID}_testpy`;
        const data: TestCodeData = JSON.parse(job.data);
        const timeLimit = data.time_limit * data.tests.length + 10; // extra 10sec just incase
        let response = await TestCodeInContainer(
            {
                codeFileSrc: codeFile.path,
                dataFileSrc: dataFile.path,
                containerName,
            },
            timeLimit,
            `${data.memory_limit}mb`
        );

        codeFile.cleanup();
        dataFile.cleanup();

        cleanup(containerName);
        return callback.constructor.name === "AsyncFunction"
            ? await callback(response)
            : callback(response);
    }
}
