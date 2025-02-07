import createError from "http-errors";
import express from "express";
import logger from "morgan";

import authRouter from "./routes/auth.js";
import articlesRouter from "./routes/articles.js";
import categoriesRouter from "./routes/categories.js";
import commentsRouter from "./routes/comments.js";
import dataSource from "./data_source.js";

export const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use("/auth", authRouter);
app.use("/articles", articlesRouter);
app.use("/categories", categoriesRouter);
app.use("/comments", commentsRouter);

app.use((req, res, next) => {
    next(createError(404));
});

dataSource
    .initialize()
    .catch((error) => {
        console.log("Error: ", error)
    });