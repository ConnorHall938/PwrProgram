import base from './base';
import { blocksRouter } from './blocks';
import { cyclesRouter } from './cycles';
import { exercisesRouter } from './exercises';
import { programsRouter } from './programs';
import { sessionsRouter } from './sessions';
import { setsRouter } from './sets';
import { usersRouter } from './users';


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