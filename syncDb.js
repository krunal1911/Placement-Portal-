require('dotenv').config();
const mongoose = require('mongoose');

const CLOUD_URI = process.env.MONGODB_URI || 'mongodb+srv://desaikrunal2005_db_user:XIdzUVr0oiicYkYl@cluster0.jketbal.mongodb.net/placementPortal';
const LOCAL_URI = 'mongodb://127.0.0.1:27017/placementPortal';

// Database Models
const Admin = require('./database/models/Admin');
const Company = require('./database/models/company');
const Question = require('./database/models/Question');
const TechnicalQuestion = require('./database/models/TechnicalQuestion');
const ActiveExamLink = require('./database/models/ActiveExamLink');
const CheatingLog = require('./database/models/CheatingLog');
const Result = require('./database/models/result');
const User = require('./database/models/user');
const Application = require('./database/models/Application');
const ExamSetting = require('./database/models/ExamSettings');

async function syncAllData() {
    console.log("==================================================");
    console.log("🔄 Starting MongoDB Atlas Cloud -> Local DB Sync...");
    console.log("==================================================");

    try {
        // 1. Connect to Cloud MongoDB
        console.log(`🌐 Connecting to Cloud Database (Atlas)...`);
        const cloudConn = await mongoose.connect(CLOUD_URI);
        console.log(`✅ Connected to Cloud Database!`);

        // 2. Fetch all collections from Cloud
        console.log(`📥 Fetching data from Cloud Database...`);
        const admins = await Admin.find({}).lean();
        const companies = await Company.find({}).lean();
        const questions = await Question.find({}).lean();
        const techQuestions = await TechnicalQuestion.find({}).lean();
        const examLinks = await ActiveExamLink.find({}).lean();
        const cheatingLogs = await CheatingLog.find({}).lean();
        const results = await Result.find({}).lean();
        const users = await User.find({}).lean();
        const applications = await Application.find({}).lean();
        const examSettings = await ExamSetting.find({}).lean();

        console.log(`📊 Cloud Records Found:`);
        console.log(` - Admins: ${admins.length}`);
        console.log(` - Companies / Drives: ${companies.length}`);
        console.log(` - Aptitude Questions: ${questions.length}`);
        console.log(` - Technical Questions: ${techQuestions.length}`);
        console.log(` - Active Exam Links: ${examLinks.length}`);
        console.log(` - Proctoring Cheating Logs: ${cheatingLogs.length}`);
        console.log(` - Student Test Results: ${results.length}`);
        console.log(` - Student Profiles: ${users.length}`);
        console.log(` - Drive Applications: ${applications.length}`);
        console.log(` - Exam Settings: ${examSettings.length}`);

        await mongoose.disconnect();

        // 3. Connect to Local MongoDB
        console.log(`\n💻 Connecting to Local Database (${LOCAL_URI})...`);
        const localConn = await mongoose.connect(LOCAL_URI);
        console.log(`✅ Connected to Local Database!`);

        // Helper to upsert array of docs into local db
        const cloneCollection = async (Model, docs, name) => {
            if (!docs || docs.length === 0) {
                console.log(` 🔹 [${name}] No records to sync.`);
                return;
            }
            let count = 0;
            for (const doc of docs) {
                await Model.updateOne({ _id: doc._id }, doc, { upsert: true });
                count++;
            }
            console.log(` ✅ [${name}] Synced ${count} records to Local DB.`);
        };

        console.log(`\n💾 Copying & Syncing Records to Local MongoDB...`);
        await cloneCollection(Admin, admins, "Admins");
        await cloneCollection(Company, companies, "Companies");
        await cloneCollection(Question, questions, "Aptitude Questions");
        await cloneCollection(TechnicalQuestion, techQuestions, "Technical Questions");
        await cloneCollection(ActiveExamLink, examLinks, "Active Exam Links");
        await cloneCollection(CheatingLog, cheatingLogs, "Cheating Logs");
        await cloneCollection(Result, results, "Results");
        await cloneCollection(User, users, "Users");
        await cloneCollection(Application, applications, "Applications");
        await cloneCollection(ExamSetting, examSettings, "Exam Settings");

        console.log("\n==================================================");
        console.log("🎉 SUCCESS: All Cloud Data Synced to Local MongoDB!");
        console.log("==================================================");
        process.exit(0);
    } catch (err) {
        console.error("❌ Sync Error:", err);
        process.exit(1);
    }
}

syncAllData();
