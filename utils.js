import jwt from "jsonwebtoken";
import {UserRole} from "./entities/user_role.js";
import {matchedData, validationResult} from "express-validator";

export const authenticateJwt = (req, res, next) => {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (token == null) return res.sendStatus(401)

    try {
        req.user = jwt.verify(token, process.env.TOKEN_SECRET);
    } catch (err) {
        res.status(401);
        return res.send({errors: ["Unauthorized"]});
    }
    next();
}

export const authAdmin = (req, res, next) => {
    if (req.user.role >= UserRole.ADMIN) return next();

    res.status(403);
    return res.send({errors: ["Insufficient privileges"]});
}

export const getValidationDataOrFail = (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400);
        return res.send({errors: result.array()});
    }

    req.validated = matchedData(req);
    next();
}