import { z } from "zod"
import { type Logger } from "winston";
import { type Connection, type Channel } from "amqplib";

export interface IGeneralRCEWorker {
    readonly queueName: string;
    readonly connection: Connection;
    readonly channel: Channel;
    readonly logger: Logger;
    start: () => Promise<void>;
}

// use this when more languages are supported:
// const SupportedLanguages = z.union([
//     z.literal("python"),
// ]);

export const RunCodeJob = z.object({
    jobID: z.string().uuid(),
    language: z.literal("python"),
})