const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Internal for me
app.get('/api/users', (req,res) => {
	res.json({message: `Getting users`});
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