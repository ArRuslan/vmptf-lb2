import {EntitySchema} from "typeorm";
import {UserRole} from "./user_role.js";

export const User= new EntitySchema({
    name: "User",
    tableName: "users",
    columns: {
        id: {primary: true, type: "int", generated: true},
        name: {type: "varchar"},
        email: {type: "varchar", unique: true},
        password: {type: "varchar"},
        role: {type: "tinyint", default: UserRole.USER},
    },
})