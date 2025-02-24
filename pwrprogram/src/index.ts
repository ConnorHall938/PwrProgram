import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
import * as express from 'express'
import mountRoutes from './routes/index'

AppDataSource.initialize().then(async connection =>{

    const app = express();
    app.use(express.json());
    mountRoutes(app);
    
    const port = 3000;
    
    app.listen(port, async () => {
        console.log(`Server running on port ${port}`);
    }); 


}).catch(error => console.log(error))
