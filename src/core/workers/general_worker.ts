import { join } from "path";
import { file } from "tmp-promise";
import { promises as fs } from "fs";

import { Worker } from "./worker";
import {
    type IWorker,
    RunCodeJob,
    RunCodeJobValidator,
    ContainerResponse,
} from "../helpers/types";
import {
    buildImage,
    imageExists,
    runCodeInContainer,
    cleanup,
} from "../helpers/docker";
import { Languages } from "../helpers/constants";

export class GeneralRCEWorker extends Worker implements IWorker {
    async start(): Promise<void> {
        this.logger.info("General Worker Consuming Messages!");

        await this.channel.prefetch(3);

        this.channel.consume(
            this.queueName,
            async (msg) => {
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
        job: RunCodeJob,
        callback: (response: ContainerResponse) => any
    ) {
        const {
            path,
            imageName,
            fileName,
            runScript,
            envFile: envFilePath,
        } = Languages[job.language];

        if (!(await imageExists(imageName))) {
            this.logger.info(`Building Image: ${imageName}`);
            await buildImage(imageName, job.language);
        }

        const envVars = Object.keys(job.enviromentVariables).length
            ? Object.keys(job.enviromentVariables)
                  .map(function (key) {
                      return key + "=" + job.enviromentVariables[key];
                  })
                  .join("\n")
            : "";

        const codeFile = await file();
        const inputFile = await file();
        const envFile = await file();

        await fs.writeFile(inputFile.path, job.input, "utf-8");
        await fs.writeFile(codeFile.path, job.code, "utf-8");
        await fs.writeFile(envFile.path, envVars, "utf-8");

        const containerName = `${job.language}_${job.jobID}_${imageName}`;

        let response = await runCodeInContainer({
            inputFileSrc: inputFile.path,
            codeFileSrc: codeFile.path,
            envFileSrc: envFile.path,
            runFileSrc: join(path, "run.sh"),
            codeFileDes: fileName,
            runFileDes: runScript,
            envFileDes: envFilePath,
            imageName: imageName,
            containerName: containerName,
        });

        codeFile.cleanup();
        inputFile.cleanup();
        envFile.cleanup();

        cleanup(containerName);
        return callback.constructor.name === "AsyncFunction"
            ? await callback(response)
            : callback(response);
    }
}
