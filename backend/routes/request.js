const express = require('express');
const router = express.Router();
const ResourceRequest = require('../models/ResourceRequest');
const Resource = require('../models/Resource');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Create a new request (User)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { type, name, ipAddress, controller, os, purpose } = req.body;
        const newRequest = new ResourceRequest({
            type,
            name,
            ipAddress,
            controller,
            os,
            purpose,
            requestedBy: req.user.userId
        });
        await newRequest.save();

        // Notify Admins
        const admins = await User.find({ role: 'Admin' });
        const notifications = admins.map(admin => ({
            recipient: admin._id,
            sender: req.user.userId,
            message: `New ${type} request for "${name}" pending approval.`
        }));
        await Notification.insertMany(notifications);

        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all pending requests (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const requests = await ResourceRequest.find({ status: 'PENDING' }).populate('requestedBy', 'username');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Approve request (Admin only)
router.put('/:id/approve', verifyToken, isAdmin, async (req, res) => {
    try {
        const request = await ResourceRequest.findById(req.params.id);
        if (!request || request.status !== 'PENDING') {
            return res.status(404).json({ message: 'Pending request not found' });
        }

        // Create the actual Resource
        const newResource = new Resource({
            type: request.type,
            name: request.name,
            ipAddress: request.ipAddress,
            controller: request.controller,
            os: request.os
        });
        await newResource.save();

        request.status = 'APPROVED';
        await request.save();

        // Notify User
        await Notification.create({
            recipient: request.requestedBy,
            sender: req.user.userId,
            message: `Your request for ${request.type} "${request.name}" has been APPROVED.`
        });

        res.json({ message: 'Request approved and resource created', resource: newResource });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Reject request (Admin only)
router.put('/:id/reject', verifyToken, isAdmin, async (req, res) => {
    try {
        const request = await ResourceRequest.findById(req.params.id);
        if (!request || request.status !== 'PENDING') {
            return res.status(404).json({ message: 'Pending request not found' });
        }

        request.status = 'REJECTED';
        await request.save();

        // Notify User
        await Notification.create({
            recipient: request.requestedBy,
            sender: req.user.userId,
            message: `Your request for ${request.type} "${request.name}" has been REJECTED.`
        });

        res.json({ message: 'Request rejected' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
