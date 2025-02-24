import express from 'express'
import {setupDatabase} from './database/create_db.ts'
import mountRoutes from './routes/index.js'

const app = express();
app.use(express.json());
mountRoutes(app);

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