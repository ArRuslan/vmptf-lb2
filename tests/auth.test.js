import {app} from "../app.js";
import {createDataSource, getDataSource} from "../data_source.js";
import request from "supertest";
import crypto from "crypto";

describe("Test auth endpoints", () => {
    beforeAll(async () => {
        process.env.TOKEN_SECRET = crypto.randomBytes(64).toString('hex');
        createDataSource({
            type: "sqlite",
            database: ":memory:",
            synchronize: true,
            dropSchema: true,
        });
        await getDataSource().initialize();
    });

    afterAll(() => {
        getDataSource().destroy();
    });

    test("Login with nonexistent credentials", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({"email": "test@example.com", "password": "123456789"})
            .set("Content-Type", "application/json");

        expect(response.statusCode).toBe(400);
        expect(response.body.token).toBeUndefined();
        expect(response.body.expires_at).toBeUndefined();
        expect(response.body.user).toBeUndefined();
    });

    test("Login with invalid email", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({"email": "testexample.com", "password": "123456789"})
            .set("Content-Type", "application/json");

        expect(response.statusCode).toBe(400);
        expect(response.body.token).toBeUndefined();
        expect(response.body.expires_at).toBeUndefined();
        expect(response.body.user).toBeUndefined();
    });

    test("Login without password", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({"email": "testexample.com", "password": ""})
            .set("Content-Type", "application/json");

        expect(response.statusCode).toBe(400);
        expect(response.body.token).toBeUndefined();
        expect(response.body.expires_at).toBeUndefined();
        expect(response.body.user).toBeUndefined();
    });

    test("Register", async () => {
        const response = await request(app)
            .post("/auth/register")
            .send({"email": "test@example.com", "password": "123456789", "name": "Test Name"})
            .set("Content-Type", "application/json");

        expect(response.statusCode).toBe(200);
        expect(response.body.token).toBeDefined();
        expect(response.body.expires_at).toBeDefined();
        expect(response.body.user).toBeDefined();
        expect(response.body.user.id).toBeDefined();
        expect(response.body.user.name).toBeDefined();
    });

    test("Login with correct credentials", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({"email": "test@example.com", "password": "123456789", "name": "Test Name"})
            .set("Content-Type", "application/json");

        expect(response.statusCode).toBe(200);
        expect(response.body.token).toBeDefined();
        expect(response.body.expires_at).toBeDefined();
        expect(response.body.user).toBeDefined();
        expect(response.body.user.id).toBeDefined();
        expect(response.body.user.name).toBeDefined();
    });
});