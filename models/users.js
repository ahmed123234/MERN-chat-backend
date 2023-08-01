const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const {GroupSchema} = require('./groups')
const UserSchema = new Schema({
    username: {
        type: String,
        unique: true
    },

    name: String,
    profilePicture: {
       type: String,
       default: ""
    },
    password: String,
    activeStatus: {
        type: Boolean,
        default: false
    },
    activeNowVisible: {
        type: Boolean,
        default: true
    },
    groups: {
        type: [GroupSchema],
        default: []
    }
}, 
{
    timestamps: true,
})

UserSchema.pre('save', async function (next) {
    console.log("user password before saving", this.password);
    

    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);

    // bcrypt.hash(this.password, salt).then((data) => {
    //         this.password = data;
    // }).catch(err => {
    //         console.error(err.message);
    // });

    console.log("user password after saving", this.password);

    next();

});

// UserSchema.post("save", function (next) {
//     console.log(this.username, this.password);
//     next();
// });

UserSchema.statics.login = async function (username, password) {
    try {
        
        const user = this.findOne({ username });

        if (user) {
            bcrypt.compare(password, user.password).then((hash) => {

                if(hash) {
                    return user;
                }
                throw Error("incorrect password")
    
            });

        } else {
            throw Error ("incorrect username");
        }
        
    } catch(err) {
        console.error(err.message);
        throw new Error(err.message);
    }
}



// UserSchema.statics.login = async function(username, password) {
//     // this here refer to the user model
    
// }

const UserModel = mongoose.model('User', UserSchema);
 
module.exports = { UserSchema, UserModel };


