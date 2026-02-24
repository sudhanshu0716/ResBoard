const mongoose = require('mongoose');

const resourceRequestSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Tester', 'VM']
    },
    name: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    controller: {
        type: String,
        required: false
    },
    os: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        required: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    }
}, { timestamps: true });

module.exports = mongoose.model('ResourceRequest', resourceRequestSchema);
