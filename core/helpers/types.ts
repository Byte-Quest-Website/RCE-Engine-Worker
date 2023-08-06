import { Connection, Channel } from "amqplib";

export interface IGeneralRCEWorker {
    readonly queueName: string;
    readonly connection: Connection;
    readonly channel: Channel;
    start: () => Promise<void>;
}
