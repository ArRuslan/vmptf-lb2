import {DataSource} from "typeorm";
import {User} from "./entities/user.js";
import {Category} from "./entities/category.js";
import {Article} from "./entities/article.js";
import {Comment} from "./entities/comment.js";

let datasource = null;

/**
 * @param {import("typeorm").DataSourceOptions} options
 * @return void
 */
export const createDataSource = (options) => {
    if (datasource !== null)
        throw "DataSource already created";
    datasource = new DataSource({
        ...options,
        entities: [User, Category, Article, Comment],
    });
}

/**
 * @return DataSource
 */
export const getDataSource = () => {
    if (datasource === null)
        throw "DataSource is not created yet";
    return datasource;
}
