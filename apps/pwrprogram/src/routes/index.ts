import { Express } from 'express';
import { DataSource } from 'typeorm';
import baseRouter from './base';
import { blocksRouter } from './blocks';
import { cyclesRouter } from './cycles';
import { exercisesRouter } from './exercises';
import { programsRouter } from './programs';
import { sessionsRouter } from './sessions';
import { setsRouter } from './sets';
import { usersRouter } from './users';
import { requireAuth } from '../middleware/auth';

const mountRoutes = (app: Express, dataSource: DataSource) => {
    // Public auth routes (no authentication required)
    app.use('/api', baseRouter(dataSource));

    // Protected routes - require authentication
    // All protected routers are mounted at /api since they define their full nested paths
    app.use('/api', requireAuth, usersRouter(dataSource));
    app.use('/api', requireAuth, programsRouter(dataSource));
    app.use('/api', requireAuth, cyclesRouter(dataSource));
    app.use('/api', requireAuth, blocksRouter(dataSource));
    app.use('/api', requireAuth, sessionsRouter(dataSource));
    app.use('/api', requireAuth, exercisesRouter(dataSource));
    app.use('/api', requireAuth, setsRouter(dataSource));
};

export default mountRoutes;