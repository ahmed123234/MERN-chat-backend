const { ObjectId } = require('mongodb');
const {Schema, model, Types } = require('mongoose');
// const { UserSchema } = require('./users')

const UserSchema = new Schema({
    userId: ObjectId,
    username: String,
    activeStatus: Boolean,
    profilePicture: String

});
const GroupSchema = new Schema({
    name: String,
    members: {
        type: [UserSchema]
        // type: [Types.ObjectId],
        // ref: "User"
    },
    profilePicture: String,
    chatColor:  { 
        type: String,
        default: ''
    },

    chatEmoji: {
        type: String,
        default: ''
    }
}, {timestamps: true})


const GroupModel = model("Group", GroupSchema);
module.exports = { GroupModel, GroupSchema };