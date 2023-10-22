import sqlite3 from "sqlite3";

export function createDbConnection(): sqlite3.Database {
    const db = new sqlite3.Database("./db/matches.db", (err) => {
        if(err) {
            return console.error(err);
        }
    });

    return db;
}