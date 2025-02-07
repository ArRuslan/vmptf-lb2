import {EntitySchema} from "typeorm";

export const Comment = new EntitySchema({
    name: "Comment",
    tableName: "comments",
    columns: {
        id: {primary: true, type: "int", generated: true},
        text: {type: "text"},
        created_at: {type: "datetime"},
    },
    relations: {
        article: {
            target: "Article",
            type: "many-to-one",
            joinTable: true,
            cascade: true,
        },
        user: {
            target: "User",
            type: "many-to-one",
            joinTable: true,
            cascade: true,
        },
    }
})