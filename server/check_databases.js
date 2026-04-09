require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Checking MongoDB databases and collections...\n');
console.log('Connection URI:', process.env.MONGO_URI.replace(/:[^:@]+@/, ':****@'));

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB\n');

        // Get the admin database
        const adminDb = mongoose.connection.db.admin();

        // List all databases
        const { databases } = await adminDb.listDatabases();
        console.log('📊 Available Databases:');
        databases.forEach(db => {
            console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });

        console.log('\n🔍 Checking current database:', mongoose.connection.db.databaseName);

        // List collections in current database
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📁 Collections in current database:');
        if (collections.length === 0) {
            console.log('  ⚠️  No collections found!');
        } else {
            for (const coll of collections) {
                const count = await mongoose.connection.db.collection(coll.name).countDocuments();
                console.log(`  - ${coll.name}: ${count} documents`);
            }
        }

        // Check the 'test' database (default)
        console.log('\n🔍 Checking "test" database:');
        const testDb = mongoose.connection.client.db('test');
        const testCollections = await testDb.listCollections().toArray();
        if (testCollections.length > 0) {
            console.log('📁 Collections in "test" database:');
            for (const coll of testCollections) {
                const count = await testDb.collection(coll.name).countDocuments();
                console.log(`  - ${coll.name}: ${count} documents`);
            }
        }

        mongoose.connection.close();
    })
    .catch(error => {
        console.error('❌ Error:', error.message);
        mongoose.connection.close();
    });
