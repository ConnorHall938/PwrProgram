import { AppDataSource } from "./data-source"
import express from 'express'
import cookieParser from 'cookie-parser'
import mountRoutes from './routes/index'

//console.log('Starting server...');

const app = express();
app.use(express.json());
app.use(cookieParser())
mountRoutes(app);

//console.log('Routes mounted, initializing database...');

// No need to check NODE_ENV here since we're handling test DB separately
AppDataSource.initialize().then(async connection => {
    //console.log('Database initialized');
    const port = 3000;
    app.listen(port, () => {
        //console.log(`Server running on port ${port}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

export { app };
