import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";

//Manipulate file with typescript to a regular expression as a paramter.
const app = new Elysia()
    .use(staticPlugin(
        {
            assets: './public',
            prefix: '/'
        }
    ))
    .get("/"
        , (context) => Bun.file("./public/base.html")
    )
    .listen(8080);

//Server Console logs
console.log(
    `
    Elysia is running at ${app.server?.hostname}:${app.server?.port}
    `
);


