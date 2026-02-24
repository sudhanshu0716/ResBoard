require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resboard';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        // Check if the admin already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('Admin account already exists! Username: admin');
            process.exit(0);
        }

        const admin = new User({
            username: 'admin',
            password: 'adminpassword',
            role: 'Admin'
        });

        await admin.save();
        console.log('Success! Admin account created.');
        console.log('Username: admin');
        console.log('Password: adminpassword');
        process.exit(0);
    })
    .catch(err => {
        console.error('Failed to connect:', err);
        process.exit(1);
    });
