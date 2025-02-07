import {EntitySchema} from "typeorm";

export const Article = new EntitySchema({
    name: "Article",
    tableName: "articles",
    columns: {
        id: {primary: true, type: "int", generated: true},
        title: {type: "varchar"},
        text: {type: "text"},
        created_at: {type: "datetime"},
    },
    relations: {
        category: {
            target: "Category",
            type: "many-to-one",
            joinTable: true,
            cascade: true,
        },
        publisher: {
            target: "User",
            type: "many-to-one",
            joinTable: true,
            cascade: true,
        },
    }
})