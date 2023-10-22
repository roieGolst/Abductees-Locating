import sqlite3 from "sqlite3"
import { createDbConnection } from "./initializer";

export class DbInstance {

    private static INSTANCE: sqlite3.Database;

    private static init(): void {
        DbInstance.INSTANCE = createDbConnection();

        DbInstance.INSTANCE.exec(`CREATE TABLE IF NOT EXISTS matches
            (
                id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                person_image VARCHAR(1500),
                is_verified INTEGER
            )`
        , (err) => {
            console.error(err);
        });
    }

    public static getInstance(): sqlite3.Database {
        if(!DbInstance.INSTANCE) {
            this.init();
        }

        return DbInstance.INSTANCE;
    }
}