import express from "express";
import {body, param, query} from "express-validator";
import {authenticateJwt, getValidationDataOrFail} from "../utils.js";
import {getDataSource} from "../data_source.js";

const router = express.Router();

router.get(
    "/:articleId",
    param("articleId").isInt(),
    query("page").default(1).trim().isInt({allow_leading_zeroes: false}),
    query("page_size").default(25).trim().isInt({allow_leading_zeroes: false}),
    getValidationDataOrFail,
    (req, res) => {
        const limit = Math.max(Math.min(req.validated.page_size, 100), 1);
        const offset = limit * (req.validated.page - 1);

        const articleRep = getDataSource().getRepository("Article");
        const commentRep = getDataSource().getRepository("Comment");
        articleRep.findBy({"id": req.validated.articleId}).then((article) => {
            if (article === null) {
                res.status(404);
                return res.send({errors: ["Unknown Article"]});
            }

            commentRep.findAndCount({
                order: {"created_at": "DESC"},
                skip: offset,
                take: limit,
                relations: {
                    user: true,
                },
            }).then(([comments, count]) => {
                res.status(200);
                res.json({
                    "count": count,
                    "result": comments.map(comment => ({
                        "id": comment.id,
                        "text": comment.text,
                        "user": {
                            "id": comment.user.id,
                            "name": comment.user.name,
                        },
                    }))
                });
            })
        });
    }
);

router.post(
    "/:articleId",
    param("articleId").isInt(),
    body("text").trim().notEmpty().escape(),
    getValidationDataOrFail,
    authenticateJwt,
    (req, res) => {
        const userRep = getDataSource().getRepository("User");
        const articleRep = getDataSource().getRepository("Article");
        const commentRep = getDataSource().getRepository("Comment");

        userRep.findOneBy({"id": req.user.uid}).then(user => {
            if (user === null) {
                res.status(401);
                return res.send({errors: ["Unauthorized"]});
            }

            articleRep.findOneBy({"id": req.validated.articleId}).then((article) => {
                if (article === null) {
                    res.status(404);
                    return res.send({errors: ["Unknown Article"]});
                }

                const comment = {
                    "text": req.validated.text,
                    "created_at": Math.floor(new Date() / 1000),
                    "article": {
                        "id": article.id,
                    },
                    "user": {
                        "id": user.id,
                        "name": user.name,
                    },
                }

                commentRep.insert(comment).then(result => {
                    delete comment["article"];
                    res.status(200);
                    res.json({
                        "id": result.identifiers[0]["id"],
                        ...comment,
                    });
                });
            });
        });
    }
);

router.delete(
    "/:articleId/:commentId",
    param("articleId").isInt(),
    param("commentId").isInt(),
    getValidationDataOrFail,
    authenticateJwt,
    (req, res) => {
        const commentRep = getDataSource().getRepository("Comment");
        commentRep.findOneBy({
            "id": req.validated.commentId,
            "article": {"id": req.validated.articleId},
            "user": {"id": req.user.uid},
        }).then((comment) => {
            if (comment === null) {
                res.status(404);
                return res.send({errors: ["Unknown Comment"]});
            }

            console.log(comment)
            commentRep.remove(comment).then((r) => {
                console.log(r)
                res.sendStatus(204);
            });
        });
    }
);

export default router;
