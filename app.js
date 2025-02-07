const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');

const authRouter = require('./routes/auth');
const articlesRouter = require('./routes/articles');
const categoriesRouter = require('./routes/categories');
const commentsRouter = require('./routes/comments');

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/auth", authRouter);
app.use("/articles", articlesRouter);
app.use("/categories", categoriesRouter);
app.use("/comments", commentsRouter);

app.use((req, res, next) => {
  next(createError(404));
});

app.listen(parseInt(process.env.PORT || "3000"));