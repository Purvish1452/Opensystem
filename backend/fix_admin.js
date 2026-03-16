require('dotenv').config();
const mongoose = require('mongoose');

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const r = await db.collection('users').updateOne(
        { email: 'admin@opensystems.dev' },
        { $set: { emailVerified: true } }
    );
    console.log('Admin emailVerified fixed, modified:', r.modifiedCount);
    // Check the login-blocking field in auth service
    const user = await db.collection('users').findOne(
        { email: 'admin@opensystems.dev' },
        { projection: { email: 1, role: 1, emailVerified: 1, accountStatus: 1, loginAttempts: 1, lockUntil: 1 } }
    );
    console.log('Admin user state:', JSON.stringify(user, null, 2));
    await mongoose.disconnect();
}
fix().catch(console.error);
