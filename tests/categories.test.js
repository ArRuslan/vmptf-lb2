import {app} from "../app.js";
import {createDataSource, getDataSource} from "../data_source.js";
import request from "supertest";
import crypto from "crypto";
import {UserRole} from "../entities/user_role.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

describe("Test categories endpoints", () => {
    let user_token, admin_token;

    beforeAll(async () => {
        process.env.TOKEN_SECRET = crypto.randomBytes(64).toString('hex');
        createDataSource({
            type: "sqlite",
            database: ":memory:",
            synchronize: true,
            dropSchema: true,
        });
        await getDataSource().initialize();
        const inserted = await getDataSource().getRepository("User").insert([
            {
                name: "test admin",
                email: "admin@test.local",
                password: bcrypt.hashSync("123456789", 4),
                role: UserRole.ADMIN,
            },
            {
                name: "test user",
                email: "user@test.local",
                password: bcrypt.hashSync("123456789", 4),
                role: UserRole.USER,
            }
        ]);
        admin_token = jwt.sign({"uid": inserted.identifiers[0]["id"], "role": UserRole.ADMIN}, process.env.TOKEN_SECRET, {expiresIn: "1d"});
        user_token = jwt.sign({"uid": inserted.identifiers[1]["id"], "role": UserRole.USER}, process.env.TOKEN_SECRET, {expiresIn: "1d"});
    });

    afterAll(() => {
        getDataSource().destroy();
    });

    test("Create category with user token", async () => {
        const response = await request(app)
            .post("/categories")
            .send({"name": "test category"})
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${user_token}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.id).toBeUndefined();
        expect(response.body.name).toBeUndefined();
    });

    test("Get empty categories", async () => {
        const response = await request(app).get("/categories");

        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBeDefined();
        expect(response.body.result).toBeDefined();
        expect(response.body.count).toBe(0);
        expect(response.body.result.length).toBe(0);
    });

    test("Create category with admin token", async () => {
        const response = await request(app)
            .post("/categories")
            .send({"name": "test category"})
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${admin_token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBeDefined();
        expect(response.body.id).toBe(1);
        expect(response.body.name).toBeDefined();
        expect(response.body.name).toBe("test category");
    });

    test("Get categories", async () => {
        const response = await request(app).get("/categories");

        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBeDefined();
        expect(response.body.result).toBeDefined();
        expect(response.body.count).toBe(1);
        expect(response.body.result.length).toBe(1);
        expect(response.body.result[0].id).toBe(1);
        expect(response.body.result[0].name).toBe("test category");
    });

    test("Get categories second page", async () => {
        const response = await request(app).get("/categories?page=2");

        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBeDefined();
        expect(response.body.result).toBeDefined();
        expect(response.body.count).toBe(1);
        expect(response.body.result.length).toBe(0);
    });

    test("Get category", async () => {
        const response = await request(app).get("/categories/1");

        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBeDefined();
        expect(response.body.id).toBe(1);
        expect(response.body.name).toBeDefined();
        expect(response.body.name).toBe("test category");
    });

    test("Get unknown category", async () => {
        const response = await request(app).get("/categories/101");

        expect(response.statusCode).toBe(404);
    });

    test("Update category", async () => {
        const response = await request(app)
            .patch("/categories/1")
            .send({"name": "new name"})
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${admin_token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBeDefined();
        expect(response.body.id).toBe(1);
        expect(response.body.name).toBeDefined();
        expect(response.body.name).toBe("new name");
    });

    test("Update unknown category", async () => {
        const response = await request(app)
            .patch("/categories/101")
            .send({"name": "new name"})
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${admin_token}`);

        expect(response.statusCode).toBe(404);
    });

    test("Delete category", async () => {
        const response = await request(app)
            .delete("/categories/1")
            .set("Authorization", `Bearer ${admin_token}`);

        expect(response.statusCode).toBe(204);
    });

    test("Delete unknown category", async () => {
        const response = await request(app)
            .delete("/categories/101")
            .set("Authorization", `Bearer ${admin_token}`);

        expect(response.statusCode).toBe(404);
    });

    test("Get deleted category", async () => {
        const response = await request(app).get("/categories/1");

        expect(response.statusCode).toBe(404);
    });
});