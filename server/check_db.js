require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        return mongoose.connection.db.collection('interviews').find({}).toArray();
    })
    .then(interviews => {
        console.log('\n📊 Total Interviews:', interviews.length);
        console.log('\n🔍 Resume Link Analysis:\n');

        interviews.forEach((interview, index) => {
            console.log(`${index + 1}. ${interview.company} - ${interview.position}`);
            console.log(`   Resume Link: ${interview.resumeLink || 'NONE'}`);
            console.log(`   LinkedIn: ${interview.linkedIn || 'NONE'}`);
            console.log('');
        });

        mongoose.connection.close();
    })
    .catch(error => {
        console.error('❌ Error:', error.message);
        mongoose.connection.close();
    });
