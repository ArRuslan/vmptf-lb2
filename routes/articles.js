import express from "express";
import {body, param, query} from "express-validator";
import dataSource from "../data_source.js";
import {authenticateJwt, getValidationDataOrFail} from "../utils.js";

const router = express.Router();

const DUMB_ARTICLE = {
    "id": 1,
    "title": "test article",
    "text": "some test article",
    "created_at": Math.floor(new Date() / 1000),
    "category": {
        "id": 1,
        "name": "test category",
    },
    "publisher": {
        "id": 1,
        "name": "some user",
    },
}

router.get(
    "/",
    query("page").trim().isInt({allow_leading_zeroes: false}).default(1),
    query("page_size").trim().isInt({allow_leading_zeroes: false}).default(25),
    getValidationDataOrFail,
    (req, res, next) => {
        const limit = Math.max(Math.min(req.validated.page_size, 100), 1);
        const offset = limit * (req.validated.page - 1);

        const articleRep = dataSource.getRepository("Article");
        articleRep.findAndCount({
            order: {"created_at": "DESC"},
            skip: offset,
            take: limit,
            relations: {
                category: true,
                publisher: true,
            },
        }).then((articles, count) => {
            res.status(200);
            res.json({
                "count": count,
                "result": articles.map(article => ({
                    "id": article.id,
                    "title": article.title,
                    "text": article.text,
                    "created_at": article.created_at,
                    "category": {
                        "id": article.category.id,
                        "name": article.category.name,
                    },
                    "publisher": {
                        "id": article.publisher.id,
                        "name": article.publisher.name,
                    },
                }))
            });
        });
    }
);

// TODO: search articles
// TODO: filter articles by category
// TODO: filter articles by user

router.post(
    "/",
    body("title").trim().notEmpty().escape(),
    body("text").trim().notEmpty().escape(),
    body("category_id").isInt({allow_leading_zeroes: false}),
    getValidationDataOrFail,
    authenticateJwt,
    (req, res, next) => {
        const data = req.validated;
        const userRep = dataSource.getRepository("User");
        const categoryRep = dataSource.getRepository("Category");
        const articleRep = dataSource.getRepository("Article");

        userRep.findOneBy({"id": req.user.uid}).then(user => {
            if (user === null) {
                res.status(401);
                return res.send({errors: ["Unauthorized"]});
            }

            categoryRep.findOneBy({"id": data.category_id}).then(category => {
                if (category === null) {
                    res.status(404);
                    return res.send({errors: ["Unknown Category"]});
                }

                const article = {
                    "title": data.title,
                    "text": data.text,
                    "created_at": Math.floor(new Date() / 1000),
                    "publisher": {
                        "id": user.id,
                        "name": user.name,
                    },
                    "category": {
                        "id": category.id,
                        "name": category.name,
                    },
                }

                articleRep.insert(article).then(result => {
                    res.status(200);
                    res.json({
                        "id": result.identifiers[0]["id"],
                        ...article,
                    });
                });
            });
        });
    }
);

router.get(
    "/:articleId",
    param("articleId").isInt(),
    getValidationDataOrFail,
    (req, res, next) => {
        const articleRep = dataSource.getRepository("Article");
        articleRep.findOne({
            where: {
                "id": req.validated.articleId,
            },
            relations: {
                category: true,
                publisher: true,
            }
        }).then(article => {
            if (article === null) {
                res.status(400);
                return res.send({errors: ["Unknown Category"]});
            }

            res.status(200);
            res.json({
                "id": article.id,
                "title": article.title,
                "text": article.text,
                "created_at": article.created_at,
                "category": {
                    "id": article.category.id,
                    "name": article.category.name,
                },
                "publisher": {
                    "id": article.publisher.id,
                    "name": article.publisher.name,
                },
            });
        });
    }
);

router.patch(
    "/:articleId",
    param("articleId").isInt(),
    body("title").trim().notEmpty().escape(),
    body("text").trim().notEmpty().escape(),
    getValidationDataOrFail,
    authenticateJwt,
    (req, res, next) => {
        const articleRep = dataSource.getRepository("Article");
        articleRep.findOne({
            where: {
                "id": req.validated.articleId,
                "publisher": {"id": req.user.uid},
            },
            relations: {
                category: true,
                publisher: true,
            }
        }).then(article => {
            if (article === null) {
                res.status(400);
                return res.send({errors: ["Unknown Article"]});
            }

            if(req.validated.title)
                article.title = req.validated.title;
            if(req.validated.text)
                article.text = req.validated.text;

            articleRep.save(article).then(() => {
                res.status(200);
                res.json({
                    "id": article.id,
                    "title": article.title,
                    "text": article.text,
                    "created_at": article.created_at,
                    "category": {
                        "id": article.category.id,
                        "name": article.category.name,
                    },
                    "publisher": {
                        "id": article.publisher.id,
                        "name": article.publisher.name,
                    },
                });
            });
        });
    }
);

router.delete(
    "/:articleId",
    param("articleId").isInt(),
    getValidationDataOrFail,
    authenticateJwt,
    (req, res, next) => {
        const articleRep = dataSource.getRepository("Article");
        articleRep.findOne({
            where: {
                "id": req.validated.articleId,
                "publisher": {"id": req.user.uid},
            },
            relations: {
                category: true,
                publisher: true,
            }
        }).then(article => {
            if (article === null) {
                res.status(400);
                return res.send({errors: ["Unknown Article"]});
            }

            articleRep.remove(article).then(() => {
                res.sendStatus(204);
            });
        });
    }
);

export default router;
