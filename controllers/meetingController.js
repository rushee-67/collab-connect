// server/controllers/meetingController.js

const Meeting = require('../models/Meeting');

const createMeeting = async (req, res) => {
  try {
    // Your create meeting logic
    res.status(201).json({ success: true, meeting: newMeeting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    // Add your meeting retrieval logic here
    res.status(200).json({ 
      success: true, 
      meeting: { id: meetingId, title: "Meeting Room" }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserMeetings = async (req, res) => {
  try {
    // Your user meetings logic
    res.status(200).json({ success: true, meetings: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// IMPORTANT: Make sure all functions are exported
module.exports = {
  createMeeting,
  getMeeting,      // ← This must be exported
  getUserMeetings
};
