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

export const SupportedLanguages = z.union([z.literal("python"), z.literal("python")])

export const RunCodeJobValidator = z.object({
    jobID: z.string().uuid(),
    language: SupportedLanguages,
    code: z.string(),
})

export type RunCodeJob = z.infer<typeof RunCodeJobValidator>