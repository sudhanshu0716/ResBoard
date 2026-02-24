const mongoose = require('mongoose');

const resourceLogSchema = new mongoose.Schema({
    resource: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource',
        required: true,
    },
    resourceName: { // Snapshot of name in case resource is deleted
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        enum: ['TAKE', 'RELEASE', 'MAINTENANCE_START', 'MAINTENANCE_END'],
        required: true,
    },
    purpose: {
        type: String,
        default: '',
    },
    durationRequested: {
        type: Number, // in minutes
        default: null,
    }
}, { timestamps: true });

module.exports = mongoose.model('ResourceLog', resourceLogSchema);
