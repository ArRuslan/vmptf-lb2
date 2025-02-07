import express from "express";
import {body, matchedData, validationResult} from "express-validator";
import {getDataSource} from "../data_source.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post(
    '/login',
    body("email").trim().isEmail(),
    body("password").trim().notEmpty(),
    (req, res) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            res.status(400);
            res.send({errors: result.array()});
            return
        }

        const data = matchedData(req);
        const userRep = getDataSource().getRepository("User");
        userRep.findOneBy({
            "email": data.email,
        }).then(user => {
            if (user === null) {
                res.status(400);
                res.send({errors: ["Invalid login or password!"]});
                return;
            }
            if (!bcrypt.compareSync(data.password, user.password)) {
                res.status(400);
                res.send({errors: ["Invalid login or password!"]});
                return;
            }

            res.status(200);
            res.json({
                "token": jwt.sign({"uid": user.id, "role": user.role}, process.env.TOKEN_SECRET, {expiresIn: "1d"}),
                "expires_at": Math.floor(new Date() / 1000) + 86400,
                "user": {
                    "id": user.id,
                    "name": user.name,
                },
            });
        });
    }
);

router.post(
    "/register",
    body("email").trim().isEmail(),
    body("name").trim().notEmpty(),
    body("password").trim().notEmpty(),
    (req, res) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            res.status(400);
            res.send({errors: result.array()});
            return
        }

        const data = matchedData(req);
        const userRep = getDataSource().getRepository("User");
        userRep.findOneBy({
            "email": data.email,
        }).then(user => {
            if (user !== null) {
                res.status(400);
                res.send({errors: ["Email is already taken!"]});
                return;
            }

            userRep.insert({
                "email": data.email,
                "password": bcrypt.hashSync(data.password, 12),
                "name": data.name,
            }).then(result => {
                const user_id = result.identifiers[0]["id"];
                res.status(200);
                res.json({
                    "token": jwt.sign({"uid": user_id, "role": result.generatedMaps[0]["role"]}, process.env.TOKEN_SECRET, {expiresIn: "1d"}),
                    "expires_at": Math.floor(new Date() / 1000) + 86400,
                    "user": {
                        "id": user_id,
                        "name": data.name,
                    },
                });
            });
        });
    }
);

export default router;
