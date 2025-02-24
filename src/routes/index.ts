import base from './base.ts';
import users from './users.ts';

const mountRoutes = (app) => {
    app.use('/api', base);
    app.use('/api/users', users);
};

export default mountRoutes;