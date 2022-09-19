import express from "express";
import scrapingRouter from "./routers/scrapingRouter";
import cors from "cors"
const app = express();
app.use(cors())
app.use("/offers", scrapingRouter);
app.listen(5000);
