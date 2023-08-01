const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    sender: {
        type: ObjectId,
        ref: "User"
    },
    recipient: {
        type: ObjectId,
        ref: "User"
    },
    text: {
        type: String
    },
    file: {
        type:String
    }
}, { timestamps: true }); //hold timestamps created at, and updated at properties

const MessageModel = mongoose.model('Message', MessageSchema);

module.exports = MessageModel;