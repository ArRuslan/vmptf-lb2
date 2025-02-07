import {EntitySchema} from "typeorm";

export const Category = new EntitySchema({
    name: "Category",
    tableName: "categories",
    columns: {
        id: {primary: true, type: "int", generated: true},
        name: {type: "varchar", unique: true},
    },
})