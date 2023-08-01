const { getMessages, deleteAllMessages } = require('../controllers/messages');
const express = require('express');
const router = express.Router();

router.get('/:userId', getMessages);
router.delete('/', deleteAllMessages )


module.exports = router;
