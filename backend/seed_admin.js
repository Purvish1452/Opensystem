require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const existing = await db.collection('users').findOne({ email: 'admin@opensystems.dev' });
    if (existing) {
        // Promote existing to admin
        await db.collection('users').updateOne(
            { email: 'admin@opensystems.dev' },
            { $set: { role: 'admin', accountStatus: 'active', isEmailVerified: true } }
        );
        console.log('Existing user promoted to admin:', existing.username);
    } else {
        const hash = await bcrypt.hash('Admin@12345!', 12);
        await db.collection('users').insertOne({
            username: 'sysadmin',
            email: 'admin@opensystems.dev',
            firstName: 'System',
            lastName: 'Admin',
            password: hash,
            role: 'admin',
            accountStatus: 'active',
            isEmailVerified: true,
            riskScore: 0,
            loginAttempts: 0,
            refreshTokens: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        console.log('Admin user created: sysadmin / admin@opensystems.dev / Admin@12345!');
    }

    // Also update yugm to admin for testing, then we can use their credentials
    await db.collection('users').updateOne(
        { username: 'yugm' },
        { $set: { isEmailVerified: true, accountStatus: 'active' } }
    );
    console.log('yugm user marked as verified + active');

    await mongoose.disconnect();
    console.log('Done.');
}

seedAdmin().catch(console.error);
