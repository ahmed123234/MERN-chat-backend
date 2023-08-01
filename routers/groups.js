const { 
    createGroup,
    getAllGroups,
    getGroups,
    deleteGroups,
    updateChatColor,
    updateChatEmoji
} = require('../controllers/group')

const { getUserGroups, getUserGroupsII} = require('../controllers/users')

const express = require('express');
const router = express.Router();

router.post('/create', createGroup);
router.get('/:userId', getUserGroupsII)
router.get('/', getUserGroups)
router.delete('/', deleteGroups);
router.get('/', getGroups)
router.patch('/:groupId/color', updateChatColor);
router.patch('/:groupId/emoji', updateChatEmoji );

module.exports = router;