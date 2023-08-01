const { 
    register_post,
    get_profile, 
    deleteAll, 
    login_post, 
    getAllUsers, 
    logout, 
    updateActiveNowVisibility, 
    updateActiveStatus,
    updateProfileImage,
    appendNewGroup
} = require('../controllers/users')

const express = require('express');
const router = express.Router();

router.post('/register', register_post);
router.post('/login', login_post);
router.get('/profile', get_profile)
router.delete('/users', deleteAll)
router.get('/people', getAllUsers)
router.post('/logout', logout);
router.put('/user/', updateActiveStatus);
router.put('/user/update-picture', updateProfileImage)
router.patch('/:userId/groups/new', appendNewGroup)

// router.put('/user/active-now-visibility', updateActiveNowVisibility)

module.exports = router;