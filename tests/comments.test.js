import {app} from "../app.js";
import {createDataSource, getDataSource} from "../data_source.js";
import request from "supertest";
import crypto from "crypto";
import {UserRole} from "../entities/user_role.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

describe("Test comments endpoints", () => {
    let token, user_id, category_id, article_id;

    beforeAll(async () => {
        process.env.TOKEN_SECRET = crypto.randomBytes(64).toString('hex');
        process.env.SKIP_CACHE = "true";
        createDataSource({
            type: "sqlite",
            database: ":memory:",
            synchronize: true,
            dropSchema: true,
        });
        await getDataSource().initialize();
        let inserted = await getDataSource().getRepository("User").insert({
            name: "test user",
            email: "user@test.local",
            password: bcrypt.hashSync("123456789", 4),
            role: UserRole.USER,
        });
        user_id = inserted.identifiers[0]["id"];
        token = jwt.sign({"uid": inserted.identifiers[0]["id"], "role": UserRole.USER}, process.env.TOKEN_SECRET, {expiresIn: "1d"});
        inserted = await getDataSource().getRepository("Category").insert({
            "name": "test",
        });
        category_id = inserted.identifiers[0]["id"];
        inserted = await getDataSource().getRepository("Article").insert({
            "title": "test",
            "text": "test article",
            "category": {"id": category_id},
            "publisher": {"id": user_id},
            "created_at": Math.floor(new Date() / 1000),
        });
        article_id = inserted.identifiers[0]["id"];
    });

    afterAll(() => {
        getDataSource().destroy();
    });

    test("Get empty comments", async () => {
        const response = await request(app).get(`/comments/${article_id}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBeDefined();
        expect(response.body.result).toBeDefined();
        expect(response.body.count).toBe(0);
        expect(response.body.result.length).toBe(0);
    });

    test("Create comment", async () => {
        const response = await request(app)
            .post(`/comments/${article_id}`)
            .send({"text": "some test comment"})
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBeDefined();
        expect(response.body.id).toBe(1);
        expect(response.body.text).toBeDefined();
        expect(response.body.text).toBe("some test comment");
        expect(response.body.user).toBeDefined();
        expect(response.body.user.id).toBe(user_id);
        expect(response.body.user.name).toBe("test user");
    });

    test("Get comments", async () => {
        const response = await request(app).get(`/comments/${article_id}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBeDefined();
        expect(response.body.result).toBeDefined();
        expect(response.body.count).toBe(1);
        expect(response.body.result.length).toBe(1);
        expect(response.body.result[0].id).toBeDefined();
        expect(response.body.result[0].id).toBe(1);
        expect(response.body.result[0].text).toBeDefined();
        expect(response.body.result[0].text).toBe("some test comment");
        expect(response.body.result[0].user).toBeDefined();
        expect(response.body.result[0].user.id).toBe(user_id);
        expect(response.body.result[0].user.name).toBe("test user");
    });

    test("Get comments second page", async () => {
        const response = await request(app).get(`/comments/${article_id}?page=2`);

        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBeDefined();
        expect(response.body.result).toBeDefined();
        expect(response.body.count).toBe(1);
        expect(response.body.result.length).toBe(0);
    });

    test("Delete comment", async () => {
        const response = await request(app)
            .delete(`/comments/${article_id}/1`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(204);
    });

    test("Delete unknown comment", async () => {
        const response = await request(app)
            .delete(`/comments/${article_id}/101`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(404);
    });

    test("Get empty comments after delete", async () => {
        const response = await request(app).get(`/comments/${article_id}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBeDefined();
        expect(response.body.result).toBeDefined();
        expect(response.body.count).toBe(0);
        expect(response.body.result.length).toBe(0);
    });
});