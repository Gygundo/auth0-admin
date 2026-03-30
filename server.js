require('dotenv').config();
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');

const usersRouter = require('./routes/users');
const blocksRouter = require('./routes/blocks');
const ticketsRouter = require('./routes/tickets');

const app = express();
const PORT = process.env.PORT || 3847;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Auth middleware — protects everything except /login
function requireAuth(req, res, next) {
  if (req.session.authenticated) return next();
  if (req.path === '/login' || req.path === '/login.html') return next();
  // API requests get 401, page requests get redirected
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.redirect('/login');
}

// Login page (served before static middleware)
app.get('/login', (req, res) => {
  if (req.session.authenticated) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.authenticated = true;
    return res.redirect('/');
  }
  return res.redirect('/login?error=1');
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Protect all routes below
app.use(requireAuth);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/users', usersRouter);
app.use('/api/blocks', blocksRouter);
app.use('/api/tickets', ticketsRouter);

app.listen(PORT, () => {
  console.log(`Auth0 Admin running at http://localhost:${PORT}`);
});
