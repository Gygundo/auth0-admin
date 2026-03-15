const { Router } = require('express');
const management = require('../lib/auth0');

const router = Router();

// Get blocks for a user by Auth0 user ID
router.get('/:id', async (req, res) => {
  try {
    const result = await management.userBlocks.list({ id: req.params.id });
    res.json(result.data);
  } catch (err) {
    console.error('Get blocks error:', err.message);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Unblock a user by Auth0 user ID
router.delete('/:id', async (req, res) => {
  try {
    await management.userBlocks.delete({ id: req.params.id });
    res.json({ message: 'User unblocked successfully' });
  } catch (err) {
    console.error('Unblock error:', err.message);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Unblock by identifier (email)
router.delete('/by-email/:email', async (req, res) => {
  try {
    await management.userBlocks.deleteByIdentifier({
      identifier: req.params.email,
    });
    res.json({ message: 'User unblocked by email successfully' });
  } catch (err) {
    console.error('Unblock by email error:', err.message);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;
