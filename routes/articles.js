import express from "express";
import {body, param, query} from "express-validator";
import {getDataSource} from "../data_source.js";
import {authenticateJwt, getValidationDataOrFail, setCacheKeyFromRequest} from "../utils.js";
import {Between, ILike} from "typeorm";
import cache_ from "express-redis-cache";

const cache = cache_({expire: 60});
const router = express.Router();

/**
 * @param {Number} limit
 * @param {Number} offset
 * @param {import("typeorm").FindManyOptions} query
 */
const fetchArticles = (limit, offset, query = {}) => {
    return new Promise(resolve => {
        const articleRep = getDataSource().getRepository("Article");
        articleRep.findAndCount({
            order: {"created_at": "DESC"},
            skip: offset,
            take: limit,
            relations: {
                category: true,
                publisher: true,
            },
            ...query,
        }).then(([articles, count]) => {
            resolve({
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
            })
        });
    })
};

router.get(
    "/",
    query("page").default(1).trim().isInt({allow_leading_zeroes: false}),
    query("page_size").default(25).trim().isInt({allow_leading_zeroes: false}),
    getValidationDataOrFail,
    setCacheKeyFromRequest("fetch-articles"),
    cache.route(),
    (req, res) => {
        const limit = Math.max(Math.min(req.validated.page_size, 100), 1);
        const offset = limit * (req.validated.page - 1);

        fetchArticles(limit, offset).then(response => {
            res.status(200);
            res.json(response);
        })
    }
);

router.get(
    "/search",
    query("title").default("").trim().escape(),
    query("text").default("").trim().escape(),
    query("category_id").default(0).trim().isInt({min: 0, allow_leading_zeroes: false}),
    query("publisher_id").default(0).trim().isInt({min: 0, allow_leading_zeroes: false}),
    query("min_date").default(0).trim().isInt({min: 0, allow_leading_zeroes: false}),
    query("max_date").default(0).trim().isInt({min: 0, allow_leading_zeroes: false}),
    query("page").default(1).trim().isInt({min: 0, allow_leading_zeroes: false}),
    query("page_size").default(25).trim().isInt({min: 0, allow_leading_zeroes: false}),
    getValidationDataOrFail,
    setCacheKeyFromRequest("search-articles"),
    cache.route(),
    (req, res) => {
        const limit = Math.max(Math.min(req.validated.page_size, 100), 1);
        const offset = limit * (req.validated.page - 1);

        req.validated.category_id = Number(req.validated.category_id);
        req.validated.publisher_id = Number(req.validated.publisher_id);
        req.validated.min_date = Number(req.validated.min_date);
        req.validated.max_date = Number(req.validated.max_date);

        const query = {};
        if(req.validated.title)
            query.title = ILike(`%${req.validated.title}%`);
        if(req.validated.text)
            query.text = ILike(`%${req.validated.text}%`);
        if(req.validated.category_id)
            query.category = {"id": req.validated.category_id};
        if(req.validated.publisher_id)
            query.publisher = {"id": req.validated.publisher_id};
        if(req.validated.min_date || req.validated.max_date)
            query.created_at = Between(
                (req.validated.min_date !== 0 || req.validated.min_date < new Date() / 1000) ? req.validated.min_date : 0,
                req.validated.max_date || (Math.floor(new Date() / 1000 + 1))
            );

        fetchArticles(limit, offset, {where: query}).then(response => {
            res.status(200);
            res.json(response);
        });
    }
);

router.post(
    "/",
    body("title").trim().notEmpty().escape(),
    body("text").trim().notEmpty().escape(),
    body("category_id").isInt({allow_leading_zeroes: false}),
    getValidationDataOrFail,
    authenticateJwt,
    (req, res) => {
        const data = req.validated;
        const userRep = getDataSource().getRepository("User");
        const categoryRep = getDataSource().getRepository("Category");
        const articleRep = getDataSource().getRepository("Article");

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
    setCacheKeyFromRequest("get-article"),
    cache.route(),
    (req, res) => {
        const articleRep = getDataSource().getRepository("Article");
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
                res.status(404);
                return res.send({errors: ["Unknown Article"]});
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
    body("title").default("").trim().escape(),
    body("text").default("").trim().escape(),
    getValidationDataOrFail,
    authenticateJwt,
    (req, res) => {
        const articleRep = getDataSource().getRepository("Article");
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
                res.status(404);
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
    (req, res) => {
        const articleRep = getDataSource().getRepository("Article");
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
                res.status(404);
                return res.send({errors: ["Unknown Article"]});
            }

            articleRep.remove(article).then(() => {
                res.sendStatus(204);
            });
        });
    }
);

export default router;
