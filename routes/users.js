const { Router } = require('express');
const management = require('../lib/auth0');

const router = Router();

// Search users by query string (email, name, etc.)
router.get('/search', async (req, res) => {
  try {
    const { q, page = 0, per_page = 20 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const result = await management.users.list({
      q,
      search_engine: 'v3',
      page: Number(page),
      per_page: Number(per_page),
      include_totals: true,
    });

    res.json(result.data);
  } catch (err) {
    console.error('User search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await management.users.get({ id: req.params.id });
    res.json(result.data);
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Get logs for a specific user
router.get('/:id/logs', async (req, res) => {
  try {
    const result = await management.users.logs.list({
      userId: req.params.id,
      per_page: 50,
      sort: 'date:-1',
    });
    res.json(result.data);
  } catch (err) {
    console.error('User logs error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    await management.users.delete({ id: req.params.id });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;
