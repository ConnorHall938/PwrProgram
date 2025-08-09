import * as Express from 'express';

import { create_session } from '../session-store';
const router = Express.Router();

export default router;

router.post('/login/:id', (req, res) => {
    let session_id = create_session(req.params.id);
    res.status(200).cookie('session_id', session_id).send(null);
});