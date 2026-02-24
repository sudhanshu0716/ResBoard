const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Tester', 'VM'],
        required: true,
    },
    name: {
        type: String,
        required: true,
        unique: true,
    },
    ipAddress: {
        type: String,
        required: true,
        unique: true,
    },
    controller: {
        type: String,
        required: true,
    },
    os: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        enum: ['FREE', 'IN-USE', 'MAINTENANCE'],
        default: 'FREE',
    },
    usedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    releasedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    takenAt: {
        type: Date,
        default: null,
    },
    releasedAt: {
        type: Date,
        default: null,
    },
    expectedReleaseAt: {
        type: Date,
        default: null,
    },
    purpose: {
        type: String,
        default: '',
    },
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
