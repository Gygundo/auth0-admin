const { Router } = require('express');
const management = require('../lib/auth0');

const router = Router();

// Send a password reset email
router.post('/password-reset', async (req, res) => {
  try {
    const { user_id, client_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const result = await management.tickets.changePassword({
      user_id,
      client_id: client_id || process.env.AUTH0_CLIENT_ID,
      mark_email_as_verified: true,
    });

    res.json({ message: 'Password reset email sent', ticket: result.data });
  } catch (err) {
    console.error('Password reset error:', err.message);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Send an email verification email
router.post('/verify-email', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const result = await management.tickets.verifyEmail({
      user_id,
    });

    res.json({ message: 'Verification email sent', ticket: result.data });
  } catch (err) {
    console.error('Verify email error:', err.message);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;
