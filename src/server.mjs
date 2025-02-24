import express from 'express'
import sqlPool, {setupDatabase, query} from './db-connection.ts'

const app = express();
app.use(express.json());

const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  console.log(`Setting up database...`);
  let result = await setupDatabase();
  if (result) {
    console.log(`Database setup complete`);
  }
  else{
    console.log(`Database setup failed`);
    process.exit(1);
  }
});

// Internal for me
app.get('/api/users/:id', async (req,res) => {
  let result = await query(`SELECT * FROM PwrProgram.users`);
  if (result.rowCount != 1) {
    res.status(404).json({message: `User ${req.params.id} not found`});
  }
  else {
    res.json(result.rows[0]);
  }
});

app.post('/api/users', async (req,res) => {
  let {name,email, password} = req.body;
  let result = await query(`INSERT INTO PwrProgram.users (name, email, password) VALUES ($1, $2, $3)`, [name, email, password]);
  if (result) {
    res.status(201).json({id: result[0].id, 
                          name: name,
                          email: email});
              }
  else {
    res.status(500).json({message: `User ${username} not created`});
  }
});


// External for the client
app.get(`/api/clients`, (req,res) => {
  res.json({message: `Getting current user's clients`});
});

app.get(`/api/coaches`, (req,res) => {
  res.json({message: `Getting current user's coaches`});
});

app.get(`/api/programs`, (req,res) => {
  res.json({message: `Getting programs for current user`});
});

app.get(`/api/clients/:id/programs`, (req,res) => {  
  res.json({message: `Getting programs for client ${req.params.id}`});
});