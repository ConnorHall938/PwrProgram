import base from './base';
import users from './users';

const mountRoutes = (app) => {
    app.use('/api', base);
   app.use('/api/users', users);
};

export default mountRoutes;