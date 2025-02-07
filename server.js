import {app} from "./app.js";
import {createDataSource, getDataSource} from "./data_source.js";

const port = parseInt(process.env.PORT || "3000");
app.listen(port, () => {
    createDataSource({
        type: "sqlite",
        database: "idk.db",
        synchronize: true,
    })
    getDataSource()
        .initialize()
        .then(() => console.log(`Server is running at port ${port}`))
        .catch((error) => {
            console.log("Error: ", error)
        });
});