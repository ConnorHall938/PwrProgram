
import { AppDataSource } from "./data-source";
import express from 'express';
import cookieParser from 'cookie-parser';
import mountRoutes from './routes/index';

export function createApp(dataSource = AppDataSource) {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    mountRoutes(app, dataSource);
    return app;
}

// Only start server if run directly (not in tests)
if (require.main === module) {
    AppDataSource.initialize().then(async connection => {
        const app = createApp(AppDataSource);
        const port = 3000;
        app.listen(port, () => {
            //console.log(`Server running on port ${port}`);
        });
    }).catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}
