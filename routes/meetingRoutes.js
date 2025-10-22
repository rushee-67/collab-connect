// server/routes/meetingRoutes.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const ScheduledMeeting = require('../models/ScheduledMeeting');

// --- SCHEDULE MEETING ---
router.post('/schedule', async (req, res) => {
  try {
    const { title, description, startTime, durationMinutes, hostUsername } = req.body;
    if (!title || !startTime || !hostUsername)
      return res.status(400).json({ message: 'Missing required fields' });

    const start = new Date(startTime);
    if (isNaN(start.getTime())) return res.status(400).json({ message: 'Invalid startTime' });

    const meetingId = uuidv4();
    const meeting = await ScheduledMeeting.create({
      meetingId,
      title,
      description,
      startTime: start,
      durationMinutes: durationMinutes || 60,
      hostUsername,
    });

    return res.status(201).json({ message: 'Meeting scheduled', meeting });
  } catch (err) {
    console.error('Schedule meeting error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// --- GET UPCOMING MEETINGS ---
router.get('/upcoming', async (req, res) => {
  try {
    const host = req.query.host;
    const now = new Date();
    const filter = host ? { hostUsername: host } : {};
    const meetings = await ScheduledMeeting.find(filter).sort({ startTime: 1 }).lean();
    const upcoming = meetings.filter(m => new Date(m.startTime) >= now);
    return res.json({ meetings: upcoming });
  } catch (err) {
    console.error('Get upcoming error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// --- GET SPECIFIC MEETING ---
router.get('/:meetingId', async (req, res) => {
  try {
    const meeting = await ScheduledMeeting.findOne({ meetingId: req.params.meetingId }).lean();
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    return res.json({ meeting });
  } catch (err) {
    console.error('Get meeting error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
