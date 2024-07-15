const MessageModel = require('../models/messages');
const jwt = require('jsonwebtoken')

const getUserDataFromRequest = (req) => {
    const { token } = req.cookies;
    console.log("token of our user is ", token)
    
    if(token) {
       const userData = jwt.verify(token, process.env.JWT_SECRET);
       return userData;
    }

}

// get the messages between the current user and the selected user(the reciver of the message)
module.exports.getMessages = async (req, res) => {
    const userId = req.params.userId; // the reciver user
    console.log('userId', userId);

    //grap the sender user (the current user fro the cookie)
    const { userId: ourUserId }  = getUserDataFromRequest(req);
   
       const messages = await MessageModel.find({
    
        // $and: {
            sender: {
                $in: [userId, ourUserId]
            },
            recipient: {
                $in: [userId, ourUserId]
            } 
        // } 
        
    }).sort({createdAt: 1}); 

    console.log("messages", messages);

    res.json(messages);
}


// delete all the messages according to sender and reciver
module.exports.deleteAllMessages = async (req, res) => {
   
    try {
        const data = await MessageModel.deleteMany();
        res.json({data});
    } catch(err) {
        res.json({error: err.message})
    }
}
