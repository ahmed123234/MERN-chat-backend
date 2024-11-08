const mongoose = require('mongoose');

module.exports.connectDB = () => {
    try {
        mongoose.connect(process.env.DB_URI);
        mongoose.connection.once('open', () => {
            console.log("connsction stablished successfully on port %s", mongoose.connection.port);
        })
    } catch(err) {
        console.error(err.message);
    }
}