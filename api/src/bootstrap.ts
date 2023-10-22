import { Express } from "express";
import { DbInstance } from "./db";

export type BootstrapArgs = {
    app: Express
    port: number
}

export async function bootstrap(args: BootstrapArgs, cb?: () => void) {
    DbInstance.getInstance();
    args.app.listen(args.port, cb);
}