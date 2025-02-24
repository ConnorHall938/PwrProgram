import Router from 'express-promise-router'
import { create_session } from '../session-store';
const router = Router()

export default router

router.post('/login/:id', (req, res) => {
    let session_id = create_session(req.params.id)
    res.status(200).cookie('session_id', session_id).send(null)
});