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
    app.use('/api/users', requireAuth, usersRouter(dataSource));
    app.use('/api/programs', requireAuth, programsRouter(dataSource));
    app.use('/api/cycles', requireAuth, cyclesRouter(dataSource));
    app.use('/api/blocks', requireAuth, blocksRouter(dataSource));
    app.use('/api/sessions', requireAuth, sessionsRouter(dataSource));
    app.use('/api/exercises', requireAuth, exercisesRouter(dataSource));
    app.use('/api/sets', requireAuth, setsRouter(dataSource));
};

export default mountRoutes;