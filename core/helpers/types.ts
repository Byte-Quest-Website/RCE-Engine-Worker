import { type Logger } from "winston";
import { type Connection, type Channel } from "amqplib";

export interface IGeneralRCEWorker {
    readonly queueName: string;
    readonly connection: Connection;
    readonly channel: Channel;
    readonly logger: Logger;
    start: () => Promise<void>;
}
