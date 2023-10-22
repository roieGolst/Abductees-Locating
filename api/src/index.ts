import { bootstrap } from "./bootstrap";
import serverRoutes from "./routes/routers";
import { DbInstance } from "./db";

const PORT = 3000;
const db = DbInstance.getInstance();

bootstrap(
    {
        app: serverRoutes,
        port: PORT
    },
    
    () => console.log("Server bound")
);

// const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
// for(let i = 0; i < 100; i++) {
//     const randomStatus = Math.random() < 0.5;
//     const someString = generateString(10);

//     db.run(`
//         INSERT INTO matches (person_image, is_verified)
//         VALUES ("${someString}", ${randomStatus}) 
//     `);
// }

// function generateString(length: number): string {
//     let result = ' ';
//     const charactersLength = characters.length;
//     for ( let i = 0; i < length; i++ ) {
//         result += characters.charAt(Math.floor(Math.random() * charactersLength));
//     }

//     return result;
// }