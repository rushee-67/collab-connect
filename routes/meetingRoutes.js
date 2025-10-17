// server/routes/meetingRoutes.js
const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const authMiddleware = require('../middleware/authMiddleware');

// Check if meetingController exists
console.log('Meeting Controller:', meetingController); // Add this for debugging

// Protected routes
router.post('/create', authMiddleware, meetingController.createMeeting);
router.get('/my-meetings', authMiddleware, meetingController.getUserMeetings);

// Public route (this is likely line 9 causing the error)
router.get('/:meetingId', meetingController.getMeeting);

module.exports = router;
