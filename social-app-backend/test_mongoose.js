const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({ name: String });
testSchema.pre('save', async function (next) {
    console.log('typeof next:', typeof next);
    console.log('next value:', next);
});
const Test = mongoose.model('Test', testSchema);

async function run() {
    await mongoose.connect('mongodb://localhost:27017/test_db', {
        serverSelectionTimeoutMS: 2000
    }).catch(() => console.log('Mock compile without connection if possible.'));

    // We can just create doc and call validate or save
    const t = new Test({ name: 'a' });
    try {
        await t.save();
    } catch (e) {
        console.log("Error:", e.message);
    }
    mongoose.disconnect();
}
run();
