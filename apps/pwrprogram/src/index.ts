import { AppDataSource } from "./data-source"
import * as express from 'express'
import * as cookieParser from 'cookie-parser'
import mountRoutes from './routes/index'


AppDataSource.initialize().then(async connection => {

    const app = express();
    app.use(express.json());
    app.use(cookieParser())
    mountRoutes(app);

    const port = 3000;

    app.listen(port, async () => {
        console.log(`Server running on port ${port}`);
    });


}).catch(error => console.log(error))
