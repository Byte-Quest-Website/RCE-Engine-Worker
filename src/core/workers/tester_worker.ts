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
import { PrismaClient, Prisma } from "@prisma/client";

export class TestCodeWorker extends Worker implements IWorker {
    async start(): Promise<void> {
        const prisma = new PrismaClient();

        this.logger.info("Test Worker Consuming Messages!");

        await this.channel.prefetch(3);

        this.channel.consume(
            this.queueName,
            async (msg) => {
                if (msg === null) {
                    return;
                }

                let parsed_job;
                try {
                    parsed_job = JSON.parse(msg.content.toString());
                } catch {
                    return this.channel.ack(msg);
                }
                let parsed = TestCodeJobValidator.safeParse(parsed_job);
                if (!parsed.success) {
                    return this.channel.ack(msg);
                }

                let job: TestCodeJob = parsed.data;

                await prisma.job.create({ data: { id: job.jobID } });
                await this.redis.set(`${job.jobID}-complete`, "false");
                this.logger.info(`Recieved Task: ${job.jobID}`);

                this.processJob(job, async (response) => {
                    this.logger.info(`Completed Task: ${job.jobID}`);
                    await this.redis.set(`${job.jobID}-complete`, "true");

                    const jsonResponse = JSON.stringify(response);
                    await this.updateDatabase(prisma, job, response);

                    if (job.replyBack) {
                        this.channel.sendToQueue(
                            msg.properties.replyTo,
                            Buffer.from(jsonResponse),
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
        const memoryLimit = data.memory_limit + 35; // because pytest takes ~35mb for some reason;
        let response = await TestCodeInContainer(
            {
                codeFileSrc: codeFile.path,
                dataFileSrc: dataFile.path,
                containerName,
            },
            timeLimit,
            `${memoryLimit}mb`
        );

        codeFile.cleanup();
        dataFile.cleanup();

        cleanup(containerName);
        return callback.constructor.name === "AsyncFunction"
            ? await callback(response)
            : callback(response);
    }

    async updateDatabase(
        prisma: PrismaClient,
        job: TestCodeJob,
        response: ContainerResponse
    ) {
        let data: {
            completed: boolean;
            completedAt: Date;
            success: boolean;
            report?: Prisma.JsonObject;
        } = {
            completed: true,
            completedAt: new Date(),
            success: true,
        };

        if (response.exitCode !== 0 || response.stdout === "") {
            data.success = false;
        }

        let container_parsed_res;
        try {
            container_parsed_res = JSON.parse(response.stdout);
            delete container_parsed_res["report"];
            response.stdout = JSON.stringify(container_parsed_res);
        } catch {
            data.success = false;
        }

        if (
            container_parsed_res === undefined ||
            container_parsed_res["success"] !== true
        ) {
            data.success = false;
        }

        if (response.outOfMemory) {
            response.stdout = JSON.stringify({
                success: true,
                outcome: "fail",
                reason: "Failed: Out Of Memory",
            });
        }

        if (data.success) {
            data.report = container_parsed_res as Prisma.JsonObject;
        }

        await prisma.job.update({
            where: {
                id: job.jobID,
            },
            data: data,
        });
    }
}
