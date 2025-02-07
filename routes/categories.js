import express from "express";
import {body, param, query} from "express-validator";
import {authAdmin, authenticateJwt, getValidationDataOrFail} from "../utils.js";
import dataSource from "../data_source.js";

const router = express.Router();

router.get(
    "/",
    query("page").trim().isInt({allow_leading_zeroes: false}).default(1),
    query("page_size").trim().isInt({allow_leading_zeroes: false}).default(25),
    getValidationDataOrFail,
    (req, res) => {
        const limit = Math.max(Math.min(req.validated.page_size, 100), 1);
        const offset = limit * (req.validated.page - 1);

        const categoryRep = dataSource.getRepository("Category");
        categoryRep.findAndCount({
            order: {"created_at": "DESC"},
            skip: offset,
            take: limit,
        }).then((categories, count) => {
            res.status(200);
            res.json({
                "count": count,
                "result": categories.map(category => ({
                    "id": category.id,
                    "title": category.name,
                }))
            });
        });
    }
);

// TODO: search categories

router.post(
    "/",
    body("name").trim().notEmpty().escape(),
    getValidationDataOrFail,
    authenticateJwt,
    authAdmin,
    (req, res) => {
        const data = req.validated;
        const categoryRep = dataSource.getRepository("Category");

        categoryRep.findOneBy({"id": data.category_id}).then(category => {
            if (category !== null) {
                res.status(400);
                return res.send({errors: ["Category already exists"]});
            }

            categoryRep.insert({"name": data.name}).then(result => {
                res.status(200);
                res.json({
                    "id": result.identifiers[0]["id"],
                    "name": data.name,
                });
            });
        });
    }
);

router.get(
    "/:categoryId",
    param("categoryId").isInt(),
    getValidationDataOrFail,
    (req, res) => {
        const categoryRep = dataSource.getRepository("Category");
        categoryRep.findOneBy({"id": req.validated.categoryId}).then(category => {
            if (category === null) {
                res.status(400);
                return res.send({errors: ["Unknown Category"]});
            }

            res.status(200);
            res.json({
                "id": category.id,
                "name": category.name,
            });
        });
    }
);

router.patch(
    "/:categoryId",
    param("categoryId").isInt(),
    body("name").trim().notEmpty().escape(),
    getValidationDataOrFail,
    authenticateJwt,
    authAdmin,
    (req, res) => {
        const categoryRep = dataSource.getRepository("Category");
        categoryRep.findOneBy({"id": req.validated.categoryId}).then(category => {
            if (category === null) {
                res.status(400);
                return res.send({errors: ["Unknown Category"]});
            }

            category.name = req.validated.name;
            categoryRep.save(category).then(() => {
                res.status(200);
                res.json({
                    "id": category.id,
                    "name": category.name,
                });
            });
        });
    }
);

router.delete(
    "/:categoryId",
    param("categoryId").isInt(),
    getValidationDataOrFail,
    authenticateJwt,
    authAdmin,
    (req, res) => {
        const categoryRep = dataSource.getRepository("Category");
        categoryRep.findOneBy({"id": req.validated.categoryId}).then(category => {
            if (category === null) {
                res.status(400);
                return res.send({errors: ["Unknown Category"]});
            }

            categoryRep.remove(category).then(() => res.sendStatus(204));
        });
    }
);

export default router;
