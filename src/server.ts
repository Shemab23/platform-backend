import app from "./app";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => console.log(`API listening on ${port}`));
