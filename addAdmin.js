const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');

mongoose.connect('mongodb://127.0.0.1:27017/placementPortal');

async function addAdmin(){

    await Admin.deleteMany();

    // 1. Create Super Admin
    const superHashed = await bcrypt.hash("superadmin123", 10);
    await Admin.create({
        username: "superadmin",
        password: superHashed,
        role: "superadmin"
    });

    // 2. Create Regular Admin
    const regularHashed = await bcrypt.hash("admin123", 10);
    await Admin.create({
        username: "admin",
        password: regularHashed,
        role: "admin"
    });

    console.log("Seeding complete: Created 'superadmin' (superadmin123) and 'admin' (admin123) accounts.");

    mongoose.connection.close();

}

addAdmin();