import { z } from "zod";
import { type Logger } from "winston";
import { type ExecException } from "child_process";
import { type Connection, type Channel } from "amqplib";

export interface IGeneralRCEWorker {
    readonly queueName: string;
    readonly connection: Connection;
    readonly channel: Channel;
    readonly logger: Logger;

    start: () => Promise<void>;
}

export const SupportedLanguages = z.union([
    z.literal("python"),
    z.literal("python"),
]);

export const RunCodeJobValidator = z.object({
    jobID: z.string().uuid(),
    language: SupportedLanguages,
    code: z.string(),
    input: z.string(),
});

export type RunCodeJob = z.infer<typeof RunCodeJobValidator>;

export type RunCodeInfo = {
    codeFileSrc: string;
    codeFileDes: string;

    runFileSrc: string;
    runFileDes: string;

    inputFileSrc: string;

    containerName: string;
    imageName: string;
};

export type RunCodeContainerResponse = {
    stdout: string;
    stderr: string;
    exitCode: number;
    executionTime: number;
    memoryKilled: boolean;
};

export type AsyncExecPromise = {
    error: ExecException | null;
    stdout: string;
    stderr: string;
};
