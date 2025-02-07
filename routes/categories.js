import express from "express";
import {body, param, query} from "express-validator";
import {authAdmin, authenticateJwt, getValidationDataOrFail} from "../utils.js";
import dataSource from "../data_source.js";

const router = express.Router();

const DUMB_CATEGORY = {
    "id": 1,
    "name": "test category",
};

router.get(
    "/",
    query("page").trim().isInt({allow_leading_zeroes: false}).default(1),
    query("page_size").trim().isInt({allow_leading_zeroes: false}).default(25),
    getValidationDataOrFail,
    (req, res, next) => {
        // TODO: fetch categories from database (with pagination)
        res.status(200);
        res.json([DUMB_CATEGORY]);
    }
);

// TODO: search categories

router.post(
    "/",
    body("name").trim().notEmpty().escape(),
    getValidationDataOrFail,
    authenticateJwt,
    authAdmin,
    (req, res, next) => {
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
    (req, res, next) => {
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
    getValidationDataOrFail,
    authenticateJwt,
    authAdmin,
    (req, res, next) => {
        // TODO: update category
        res.status(200);
        res.json(DUMB_CATEGORY);
    }
);

router.delete(
    "/:categoryId",
    param("categoryId").isInt(),
    getValidationDataOrFail,
    authenticateJwt,
    authAdmin,
    (req, res, next) => {
        // TODO: delete category from database
        res.status(204);
    }
);

export default router;
