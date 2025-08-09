import base from './base';
import { usersRouter } from './users';
import { programsRouter } from './programs';
import { setsRouter } from './sets';
import { exercisesRouter } from './exercises';
import { cyclesRouter } from './cycles';
import { blocksRouter } from './blocks';
import { sessionsRouter } from './sessions';


const mountRoutes = (app, dataSource) => {
    app.use('/api', base);
    app.use('/api/users', usersRouter(dataSource));
    app.use('/api/programs', programsRouter(dataSource));
    app.use('/api/cycles', cyclesRouter(dataSource));
    app.use('/api/blocks', blocksRouter(dataSource));
    app.use('/api/sessions', sessionsRouter(dataSource));
    app.use('/api/exercises', exercisesRouter(dataSource));
    app.use('/api/sets', setsRouter(dataSource));
};

export default mountRoutes;