import { z } from "zod";
import { createClient } from "redis";
import { type Logger } from "winston";
import { type ExecException } from "child_process";
import { type Connection, type Channel } from "amqplib";

export interface IWorker {
    readonly queueName: string;
    readonly connection: Connection;
    readonly channel: Channel;
    readonly logger: Logger;
    readonly redis: ReturnType<typeof createClient>;
}

export type AsyncExecPromise = {
    error: ExecException | null;
    stdout: string;
    stderr: string;
};

export type ContainerResponse = {
    stdout: string;
    stderr: string;
    exitCode: number;
    executionTime: number;
    outOfMemory: boolean;
    timedOut: boolean;
};

export const SupportedRunCodeLanguages = z.union([
    z.literal("python"),
    z.literal("ricklang"),
    z.literal("node"),
    z.literal("c"),
]);

export const RunCodeJobValidator = z.object({
    jobID: z.string().uuid(),
    language: SupportedRunCodeLanguages,
    code: z.string(),
    input: z.string(),
    replyBack: z.boolean().default(false),
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

export const TestCodeJobValidator = z.object({
    jobID: z.string().uuid(),
    code: z.string(),
    data: z.string(),
    replyBack: z.boolean().default(false),
});

export type TestCodeJob = z.infer<typeof TestCodeJobValidator>;
