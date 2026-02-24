const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const ResourceLog = require('../models/ResourceLog');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get all resources
router.get('/', verifyToken, async (req, res) => {
    try {
        const resources = await Resource.find().populate('usedBy', 'username').populate('releasedBy', 'username');
        res.json(resources);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Admin: Create resource
router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const resource = new Resource(req.body);
        await resource.save();
        res.status(201).json(resource);
    } catch (error) {
        res.status(400).json({ message: 'Could not create resource', error: error.message });
    }
});

// General update (Admin can update all, User limited)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { name, ipAddress, controller, os, state, purpose } = req.body;
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        if (req.user.role === 'Admin') {
            // Full access
            if (name) resource.name = name;
            if (ipAddress) resource.ipAddress = ipAddress;
            if (controller) resource.controller = controller;
            if (os) resource.os = os;
            if (state) resource.state = state;
            if (purpose !== undefined) resource.purpose = purpose;
        } else {
            // User access (cannot edit Name, IP)
            if (resource.state === 'MAINTENANCE') {
                return res.status(403).json({ message: 'Only admins can edit resources in maintenance' });
            }
            if (resource.state === 'IN-USE' && resource.usedBy && resource.usedBy.toString() !== req.user.userId) {
                return res.status(403).json({ message: 'You cannot edit a resource taken by someone else' });
            }

            if (controller) resource.controller = controller;
            if (os) resource.os = os;
            if (purpose !== undefined) resource.purpose = purpose;

            // State updates via take/release handlers are better, but if they try to update here:
            if (state && state === 'MAINTENANCE') {
                return res.status(403).json({ message: 'Only admins can set maintenance mode' });
            }
        }

        if (state && resource.state !== state && (state === 'MAINTENANCE' || resource.state === 'MAINTENANCE')) {
            await ResourceLog.create({
                resource: resource._id,
                resourceName: resource.name,
                user: req.user.userId,
                action: state === 'MAINTENANCE' ? 'MAINTENANCE_START' : 'MAINTENANCE_END'
            });
        }

        if (state) resource.state = state;

        await resource.save();
        res.json(resource);
    } catch (error) {
        res.status(400).json({ message: 'Could not update resource', error: error.message });
    }
});

// Take Resource
router.post('/:id/take', verifyToken, async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: 'Resource not found' });

        if (resource.state !== 'FREE') {
            return res.status(400).json({ message: 'Resource is not free' });
        }

        resource.state = 'IN-USE';
        resource.usedBy = req.user.userId;
        const now = new Date();
        resource.takenAt = now;
        resource.purpose = req.body.purpose || '';

        // Add expectedReleaseAt calculation
        let durationMinutes = null;
        if (req.body.duration) {
            durationMinutes = req.body.duration;
            resource.expectedReleaseAt = new Date(now.getTime() + req.body.duration * 60000);
        } else {
            resource.expectedReleaseAt = null;
        }

        await resource.save();

        // Create log entry
        await ResourceLog.create({
            resource: resource._id,
            resourceName: resource.name,
            user: req.user.userId,
            action: 'TAKE',
            purpose: req.body.purpose || '',
            durationRequested: durationMinutes
        });

        res.json(resource);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Release Resource
router.post('/:id/release', verifyToken, async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: 'Resource not found' });

        if (resource.state === 'FREE') {
            return res.status(400).json({ message: 'Resource is already free' });
        }

        if (req.user.role !== 'Admin') {
            if (resource.state === 'MAINTENANCE') {
                return res.status(403).json({ message: 'Only admins can release from maintenance' });
            }
        }

        resource.state = 'FREE';
        resource.releasedBy = req.user.userId;
        resource.releasedAt = new Date();
        const prevUsedBy = resource.usedBy || req.user.userId;
        resource.usedBy = null;
        resource.purpose = '';
        resource.expectedReleaseAt = null;

        await resource.save();

        // Create Log entry for Release
        await ResourceLog.create({
            resource: resource._id,
            resourceName: resource.name,
            user: req.user.userId,
            action: 'RELEASE'
        });

        res.json(resource);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Urgent Request
router.post('/:id/urgent-request', verifyToken, async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: 'Resource not found' });

        if (resource.state !== 'IN-USE' || !resource.usedBy) {
            return res.status(400).json({ message: 'Resource is not currently in use' });
        }

        if (resource.usedBy.toString() === req.user.userId) {
            return res.status(400).json({ message: 'You already hold this resource' });
        }

        // Import Notification model inside route to avoid circular dep if any, though require is fine
        const Notification = require('../models/Notification');
        const notification = new Notification({
            recipient: resource.usedBy,
            sender: req.user.userId,
            resource: resource._id,
            message: `URGENT: Another user needs ${resource.name} immediately. Please release it if possible.`,
        });

        await notification.save();
        res.status(201).json({ message: 'Urgent request sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Admin: Delete resource
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await Resource.findByIdAndDelete(req.params.id);
        res.json({ message: 'Resource deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Seed data (for easy testing without manual DB inserts initially)
router.post('/seed', async (req, res) => {
    // Unprotected seed for demo/setup purposes only
    await Resource.deleteMany({});
    const seeds = [
        { type: 'Tester', name: 'Tester-01', ipAddress: '192.168.1.101', controller: 'Lab A', os: 'Windows 10' },
        { type: 'Tester', name: 'Tester-02', ipAddress: '192.168.1.102', controller: 'Lab B', os: 'Linux Ubuntu' },
        { type: 'VM', name: 'VM-Host-01', ipAddress: '10.0.0.51', controller: 'Server Rack 1', os: 'CentOS 8' },
        { type: 'VM', name: 'VM-Host-02', ipAddress: '10.0.0.52', controller: 'Server Rack 1', os: 'Windows Server 2022' }
    ];
    await Resource.insertMany(seeds);
    res.json({ message: 'Database seeded with sample resources' });
});

module.exports = router;
