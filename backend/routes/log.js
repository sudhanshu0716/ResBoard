const express = require('express');
const router = express.Router();
const ResourceLog = require('../models/ResourceLog');
const Resource = require('../models/Resource');
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get all logs (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const logs = await ResourceLog.find()
            .populate('user', 'username email') // populate user details
            .sort({ createdAt: -1 })
            .limit(200); // Limit to last 200 for performance
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get insights (Admin only)
router.get('/insights', verifyToken, isAdmin, async (req, res) => {
    try {
        // 1. Most active users (who took the most resources)
        const activeUsers = await ResourceLog.aggregate([
            { $match: { action: 'TAKE' } },
            { $group: { _id: '$user', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Populate user names for the active users insight
        const populatedUsers = await User.populate(activeUsers, { path: '_id', select: 'username' });

        // 2. Most used resources
        const usedResources = await ResourceLog.aggregate([
            { $match: { action: 'TAKE' } },
            { $group: { _id: '$resourceName', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // 3. Current Live Stats (similar to dashboard but backend generated)
        const totalResources = await Resource.countDocuments();
        const inUseResources = await Resource.countDocuments({ state: 'IN-USE' });

        res.json({
            activeUsers: populatedUsers.map(u => ({ username: u._id?.username || 'Deleted User', takes: u.count })),
            usedResources: usedResources.map(r => ({ resourceName: r._id, takes: r.count })),
            liveStats: { total: totalResources, inUse: inUseResources }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
