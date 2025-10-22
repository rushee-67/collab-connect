// server/models/ScheduledMeeting.js
const mongoose = require('mongoose');

const ScheduledMeetingSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, unique: true }, // uuid
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: Date, required: true }, // scheduled start (ISO)
  durationMinutes: { type: Number, default: 60 },
  hostUsername: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ScheduledMeeting', ScheduledMeetingSchema);
