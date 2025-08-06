import base from './base';
import users from './users';
import programs from './programs'
import { removeNullsMiddleware } from '../../middleware/removeNulls';
import sets from './sets';
import exercises from './exercises';
import cycles from './cycles';
import blocks from './blocks';
import sessions from './sessions';


const mountRoutes = (app) => {
    app.use(removeNullsMiddleware); // Apply the middleware globally
    app.use('/api', base);
    app.use('/api/users', users);
    app.use('/api/programs', programs);
    app.use('/api/cycles', cycles);
    app.use('/api/blocks', blocks);
    app.use('/api/sessions', sessions);
    app.use('/api/exercises', exercises);
    app.use('/api/sets', sets);
};

export default mountRoutes;