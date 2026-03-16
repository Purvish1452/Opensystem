require('dotenv').config();
const mongoose = require('mongoose');

async function findAdminAndUsers() {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // Find admin users
    const admins = await db.collection('users').find({ role: 'admin' })
        .project({ email: 1, username: 1, role: 1, accountStatus: 1, isEmailVerified: 1 })
        .limit(5).toArray();

    console.log('\n=== ADMIN USERS ===');
    if (admins.length === 0) {
        console.log('No admin users found.');
    } else {
        admins.forEach(a => console.log(JSON.stringify(a)));
    }

    // Find any verified active users
    const users = await db.collection('users').find({ role: { $ne: 'admin' }, accountStatus: 'active' })
        .project({ email: 1, username: 1, role: 1, isEmailVerified: 1, accountStatus: 1 })
        .limit(5).toArray();

    console.log('\n=== ACTIVE NORMAL USERS ===');
    users.forEach(u => console.log(JSON.stringify(u)));

    await mongoose.disconnect();
}

findAdminAndUsers().catch(console.error);
