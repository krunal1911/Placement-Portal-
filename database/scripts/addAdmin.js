require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

async function addAdmin(){
    await connectDB();

    await Admin.deleteMany();

    // 1. Create Super Admin
    const superHashed = await bcrypt.hash("superadmin123", 10);
    await Admin.create({
        username: "superadmin",
        password: superHashed,
        role: "superadmin"
    });

    // 2. Create Regular Admin (General)
    const regularHashed = await bcrypt.hash("admin123", 10);
    await Admin.create({
        username: "admin",
        password: regularHashed,
        role: "admin",
        companyName: "General"
    });

    // 3. Create Company Admin (TCS)
    await Admin.create({
        username: "tcs_admin",
        password: regularHashed,
        role: "admin",
        companyName: "TCS"
    });

    // 4. Create Company Admin (Chemical Industry)
    await Admin.create({
        username: "chemical_admin",
        password: regularHashed,
        role: "admin",
        companyName: "Chemical Industry"
    });

    console.log("Seeding complete: Created 'superadmin', 'admin', 'tcs_admin', and 'chemical_admin' accounts.");

    mongoose.connection.close();

}

addAdmin();