import {DataSource} from "typeorm";
import {User} from "./entities/user.js";
import {Category} from "./entities/category.js";
import {Article} from "./entities/article.js";
import {Comment} from "./entities/comment.js";

export default new DataSource({
    type: "sqlite",
    database: "idk.db",
    synchronize: true,
    entities: [User, Category, Article, Comment],
})