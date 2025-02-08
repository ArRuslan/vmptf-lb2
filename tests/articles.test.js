import {app} from "../app.js";
import {createDataSource, getDataSource} from "../data_source.js";
import request from "supertest";
import crypto from "crypto";
import {UserRole} from "../entities/user_role.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

describe("Test articles endpoints", () => {
    let token, user_id, category_id;

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
    });

    afterAll(() => {
        getDataSource().destroy();
    });

    test("Get empty articles", async () => {
        const response = await request(app).get("/articles");

        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBeDefined();
        expect(response.body.result).toBeDefined();
        expect(response.body.count).toBe(0);
        expect(response.body.result.length).toBe(0);
    });

    test("Create article", async () => {
        const response = await request(app)
            .post("/articles")
            .send({"title": "test", "text": "some article test", "category_id": category_id})
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBeDefined();
        expect(response.body.id).toBe(1);
        expect(response.body.title).toBeDefined();
        expect(response.body.title).toBe("test");
        expect(response.body.text).toBeDefined();
        expect(response.body.text).toBe("some article test");
        expect(response.body.category).toBeDefined();
        expect(response.body.category.id).toBe(category_id);
        expect(response.body.category.name).toBe("test");
        expect(response.body.publisher).toBeDefined();
        expect(response.body.publisher.id).toBe(user_id);
        expect(response.body.publisher.name).toBe("test user");
    });

    const _searchArticlesExpect = (response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBeDefined();
        expect(response.body.result).toBeDefined();
        expect(response.body.count).toBe(1);
        expect(response.body.result.length).toBe(1);
        expect(response.body.result[0].id).toBeDefined();
        expect(response.body.result[0].id).toBe(1);
        expect(response.body.result[0].title).toBeDefined();
        expect(response.body.result[0].title).toBe("test");
        expect(response.body.result[0].text).toBeDefined();
        expect(response.body.result[0].text).toBe("some article test");
        expect(response.body.result[0].category).toBeDefined();
        expect(response.body.result[0].category.id).toBe(category_id);
        expect(response.body.result[0].category.name).toBe("test");
        expect(response.body.result[0].publisher).toBeDefined();
        expect(response.body.result[0].publisher.id).toBe(user_id);
        expect(response.body.result[0].publisher.name).toBe("test user");
    }

    test("Get articles", async () => {
        const response = await request(app).get("/articles");
        _searchArticlesExpect(response);
    });

    test("Search articles by name", async () => {
        const response = await request(app).get("/articles/search?title=te");
        _searchArticlesExpect(response);
    });

    test("Search articles by name (empty)", async () => {
        const response = await request(app).get("/articles/search?title=idk");
        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBeDefined();
        expect(response.body.result).toBeDefined();
        expect(response.body.count).toBe(0);
        expect(response.body.result.length).toBe(0);
    });

    test("Search articles by text", async () => {
        const response = await request(app).get("/articles/search?text=some");
        _searchArticlesExpect(response);
    });

    test("Search articles by text (empty)", async () => {
        const response = await request(app).get("/articles/search?text=idk");
        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBeDefined();
        expect(response.body.result).toBeDefined();
        expect(response.body.count).toBe(0);
        expect(response.body.result.length).toBe(0);
    });

    test("Search articles by category", async () => {
        const response = await request(app).get(`/articles/search?category_id=${category_id}`);
        _searchArticlesExpect(response);
    });

    test("Search articles by category (empty)", async () => {
        const response = await request(app).get("/articles/search?category_id=101");
        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBeDefined();
        expect(response.body.result).toBeDefined();
        expect(response.body.count).toBe(0);
        expect(response.body.result.length).toBe(0);
    });

    test("Search articles by publisher", async () => {
        const response = await request(app).get(`/articles/search?publisher_id=${user_id}`);
        _searchArticlesExpect(response);
    });

    test("Search articles by publisher (empty)", async () => {
        const response = await request(app).get("/articles/search?publisher_id=101");
        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBeDefined();
        expect(response.body.result).toBeDefined();
        expect(response.body.count).toBe(0);
        expect(response.body.result.length).toBe(0);
    });

    test("Search articles by date", async () => {
        const response = await request(app).get(`/articles/search?min_date=${Math.floor(new Date() / 1000 - 60)}`);
        _searchArticlesExpect(response);
    });

    test("Search articles by date (empty)", async () => {
        const response = await request(app).get(`/articles/search?min_date=${Math.floor(new Date() / 1000 + 1)}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBeDefined();
        expect(response.body.result).toBeDefined();
        expect(response.body.count).toBe(0);
        expect(response.body.result.length).toBe(0);
    });

    test("Get articles second page", async () => {
        const response = await request(app).get("/articles?page=2");

        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBeDefined();
        expect(response.body.result).toBeDefined();
        expect(response.body.count).toBe(1);
        expect(response.body.result.length).toBe(0);
    });

    test("Get article", async () => {
        const response = await request(app).get("/articles/1");

        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBeDefined();
        expect(response.body.id).toBe(1);
        expect(response.body.title).toBeDefined();
        expect(response.body.title).toBe("test");
        expect(response.body.text).toBeDefined();
        expect(response.body.text).toBe("some article test");
        expect(response.body.category).toBeDefined();
        expect(response.body.category.id).toBe(category_id);
        expect(response.body.category.name).toBe("test");
        expect(response.body.publisher).toBeDefined();
        expect(response.body.publisher.id).toBe(user_id);
        expect(response.body.publisher.name).toBe("test user");
    });

    test("Get unknown article", async () => {
        const response = await request(app).get("/articles/101");

        expect(response.statusCode).toBe(404);
    });

    test("Update article", async () => {
        const response = await request(app)
            .patch("/articles/1")
            .send({"title": "new title"})
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBeDefined();
        expect(response.body.id).toBe(1);
        expect(response.body.title).toBeDefined();
        expect(response.body.title).toBe("new title");
        expect(response.body.text).toBeDefined();
        expect(response.body.text).toBe("some article test");
        expect(response.body.category).toBeDefined();
        expect(response.body.category.id).toBe(category_id);
        expect(response.body.category.name).toBe("test");
        expect(response.body.publisher).toBeDefined();
        expect(response.body.publisher.id).toBe(user_id);
        expect(response.body.publisher.name).toBe("test user");
    });

    test("Update unknown article", async () => {
        const response = await request(app)
            .patch("/articles/101")
            .send({"title": "new name"})
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(404);
    });

    test("Delete article", async () => {
        const response = await request(app)
            .delete("/articles/1")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(204);
    });

    test("Delete unknown article", async () => {
        const response = await request(app)
            .delete("/articles/101")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(404);
    });

    test("Get deleted article", async () => {
        const response = await request(app).get("/articles/1");

        expect(response.statusCode).toBe(404);
    });
});