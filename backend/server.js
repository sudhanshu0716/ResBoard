require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const resourceRoutes = require('./routes/resource');
const notificationRoutes = require('./routes/notification');
const logRoutes = require('./routes/log');
const requestRoutes = require('./routes/request');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/requests', requestRoutes);

// Database Connection
const PORT = process.env.PORT || 5005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resboard';

const Resource = require('./models/Resource');

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');

        // Auto-release expired resources every minute
        setInterval(async () => {
            try {
                const now = new Date();
                const result = await Resource.updateMany(
                    { state: 'IN-USE', expectedReleaseAt: { $lte: now, $ne: null } },
                    { $set: { state: 'FREE', usedBy: null, purpose: '', expectedReleaseAt: null, releasedAt: now } }
                );
                if (result.modifiedCount > 0) {
                    console.log(`Auto-released ${result.modifiedCount} expired resources.`);
                }
            } catch (e) {
                console.error('Auto release error', e);
            }
        }, 60000);
    })
    .catch((err) => {
        console.error('MongoDB connection error. Please ensure MongoDB is running:', err.message);
    });

// Always start the Express server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
