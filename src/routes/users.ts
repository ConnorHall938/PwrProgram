import Router from 'express-promise-router'
import {query} from '../database/index.ts'

const router = Router()
export default router

router.get('/:id', async (req,res) => {
    let result = await query(`SELECT * FROM PwrProgram.users WHERE id = $1`, [req.params.id]);
    if (result.rowCount != 1) {
        res.status(404).json({message: `User ${req.params.id} not found`});
    }
    else {
        res.json(result.rows[0]);
    }
});

router.get('/', async (req,res) => {
    let result = await query(`SELECT * FROM PwrProgram.users`, []);
    res.json(result.rows);
});

router.post('/', async (req,res) => {
  let {name,email, password} = req.body;
  let result = await query(`INSERT INTO PwrProgram.users (name, email, password) VALUES ($1, $2, $3) RETURNING id`, [name, email, password]);
  if (result) {
    res.status(201).json({id: result.rows[0].id, 
                          name: name,
                          email: email});
              }
  else {
    res.status(500).json({message: `User ${name} not created`});
  }
});