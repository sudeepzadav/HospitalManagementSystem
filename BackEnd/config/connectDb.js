const mongoose = require ("mongoose");

async function connectDb(params) {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Db connected successfully");
    } catch (error) {
       console.log(error); 
    }
};

module.exports = connectDb;