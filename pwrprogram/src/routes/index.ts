import base from './base';
import users from './users';
import programs from './programs'

const mountRoutes = (app) => {
    app.use('/api', base);
    app.use('/api/users', users);
    app.use('/api/programs', programs);
};

export default mountRoutes;