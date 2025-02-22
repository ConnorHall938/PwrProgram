const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});


app.get('/api/users', (req,res) => {
	res.json({message: `Hello, world!`});
});