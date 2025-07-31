import base from './base';
import users from './users';
import programs from './programs'
import { removeNullsMiddleware } from '../../middleware/removeNulls';


const mountRoutes = (app) => {
    app.use(removeNullsMiddleware); // Apply the middleware globally
    app.use('/api', base);
    app.use('/api/users', users);
    app.use('/api/programs', programs);
};

export default mountRoutes;