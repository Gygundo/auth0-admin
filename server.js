require('dotenv').config();
const express = require('express');
const path = require('path');

const usersRouter = require('./routes/users');
const blocksRouter = require('./routes/blocks');
const ticketsRouter = require('./routes/tickets');

const app = express();
const PORT = process.env.PORT || 3847;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/users', usersRouter);
app.use('/api/blocks', blocksRouter);
app.use('/api/tickets', ticketsRouter);

app.listen(PORT, () => {
  console.log(`Auth0 Admin running at http://localhost:${PORT}`);
});
