const { UserModel } = require('../models/users');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const fs = require('fs');

const generateToken = (user) => {
 
    const token = jwt.sign(
        { 
            userId: user._id,
            username: user.username,
            activeStatus: user.activeStatus,
            activeNowVisible: user.activeNowVisible,
            profilePicture: user.profilePicture
        }, 
        process.env.JWT_SECRET
    )

    console.log("decoded token is", jwt.verify(token, process.env.JWT_SECRET));
    return token;
}

const verifyToken = (req) => {
    const { token } = req.cookies;

    if (token) {
       const decodedToken = jwt.verify(token, process.env.JWT_SECRET)    
        
       return decodedToken;
    } else {
        return { error: "Please login or signup to access the resource" }
    }
}

module.exports.deleteAll = async (req, res) => {
    try {
        const data = await UserModel.deleteMany();
        res.json({
            data: {
                message: (data.deletedCount) ? "users are deleted successfully" : "no such users to be deleted",
                "deletedCount": data.deletedCount
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const login = async (username, password) => {
    const user = await UserModel.findOne({ username });

    if (user) {

        console.log(user);
        // bcrybt compare method will take into it's account to hash the textplain password and then compare it with the user hashed password
        const auth = await bcrypt.compare(password, user.password);
    
        if (auth) {
            console.log("true and user is handeled", auth);
            return user;
        } 
        throw new Error ('incorrect password');

    } 
    throw new Error ('incorrect username');
}


module.exports.login_post = async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log(username, password);

        const user = await login(username, password);

        const token = generateToken(user);

        console.log("token is genreted for user %s", user.username, token);
            res.cookie('token', token, {
                // maxAge: 90000000,
                httpOnly: true,
                sameSite: 'none', //the browser can send the cookie between two different hodtnames
                secure: true

            });
            res.json({ 
                id: user._id,
                username,
                activeStatus: user.activeStatus,
                activeNowVisible: user.activeNowVisible,
                profilePicture: user.profilePicture
            });

    } catch (err) {
        if (err.message === 'incorrect password') {
            res.status(401).json({ error: "Password is incorrect" });
        } else if (err.message === "incorrect username") {
            res.status(401).json({ error: "username is incorrect" });
        } else
            res.status(500).json({ error: err.message })

    }
}

module.exports.register_post = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = new UserModel({
            username,
            password, 
        });

        await user.save();
        const token = generateToken(user); 

        console.log("token is genreted for user %s", user.username, token);
            res.cookie('token', token, {
                // maxAge: 900000,
                httpOnly: true,
                sameSite: 'none', //the browser can send the cookie between two different hodtnames
                secure: true

            });
            res.status(201).json({ 

                id: user._id,
                username,
                activeStatus: user.activeStatus,
                activeNowVisible: user.activeNowVisible,
                profilePicture: user.profilePicture

             });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
}


module.exports.get_profile = (req, res) => {

    const message = verifyToken(req);
    console.log("message of the token is ", message);

    if ('userId' in message) {
        res.status(200).json(message)
    } else {
        res.status(401).json(message)
    }
}

module.exports.getAllUsers = async (req, res) => {
    const message = verifyToken(req);
    if ('userId' in message) {
        try {
            const users = await UserModel.find().select(["username","profilePicture"]).exec();

            console.log({users});
            res.json(users);

        } catch(err) {
            console.log("inside get all users", err.message);

            res.status(500).json({ error: err.message });
        
        }
    } else {
        res.status(401).json(message)
    }
}

module.exports.logout = async (_, res) => {

    res.cookie("token", '', {
        httpOnly: true,
        sameSite: 'none', //the browser can send the cookie between two different hostnames
        secure: true,
        maxAge: 10

    }).json({message: "logout successfully"});
}

module.exports.updateProfileImage = async (req, res) => {
    const { image } = req.body;
    console.log("image is", image);
    const message = verifyToken(req);
    console.log("cookie is", message);

    if ('userId' in message ) {
    try {
        const { userId, username, activeNowVisible, activeStatus, profilePicture= null } = message;
        const filePath = `${__dirname}/../uploads/profile_pictures/`
        const filename = `${userId}.png`;
        const data = image.split(',')[1]; 
        fs.writeFile(`${filePath}${filename}`, data, {encoding: "base64"}, async (err) => {
            if(err) {
                console.error(err.message);
            } else {
                console.log("File %s saved ", filePath);
                const data = await UserModel.findByIdAndUpdate(userId, {
                    profilePicture: filename
                });
                console.log("iamge change successfully", data);
                const token = jwt.sign({ userId, username, activeStatus, activeNowVisible, profilePicture: filename }, process.env.JWT_SECRET)

                console.log("token now is", token);
                res.cookie('token', token, {
                    httpOnly: true,
                    sameSite: 'none', //the browser can send the cookie between two different hodtnames
                    secure: true,  
                }).json(data);

            }
        })

    } catch(err) {
        res.status(500).json({error: err.message})
    }
} else {
    res.status(401).json({message})
}
     
}


module.exports.updateActiveStatus = async (req, res) => {
    const message = verifyToken(req);
    const search = req.query.search;
    let state = req.query.state;

    if ('userId' in message ) {
        const { userId, username, activeStatus, activeNowVisible, profilePicture } = message;
        let token;
        

        if(search === 'activeStatus') {
            console.log("update active status");

            if (state === undefined) state = activeStatus;

            await UserModel.findByIdAndUpdate(userId, {activeStatus: state});
            const data = await UserModel.findById(userId).select("activeStatus");
            token = jwt.sign({ userId, username, activeStatus: data.activeStatus, activeNowVisible, profilePicture }, process.env.JWT_SECRET)

            console.log("token now", token);

        }
        else if (search === 'activeNowVisible') {
            console.log("update active visible status");
            if (state === undefined) state = activeNowVisible;
            await UserModel.findByIdAndUpdate(userId, {activeNowVisible: state});
            const data = await UserModel.findById(userId).select("activeNowVisible");
            token = jwt.sign({ userId, username, activeStatus, activeNowVisible: data.activeNowVisible, profilePicture }, process.env.JWT_SECRET)
            console.log("token now", token);
        }
      
        res.cookie("token",token, {
            httpOnly: true,
            sameSite: 'none', //the browser can send the cookie between two different hodtnames
            secure: true,
    
        }).json({state});

    } else {
        res.status(401).json(message)
    }
}

module.exports.getUserGroups = async (req, res) => {
    try {
        const message = verifyToken(req);
        console.log("message of the token is ", message);

        if ('userId' in message) {
            const { userId } = message;
            const data = await UserModel.findById(userId).select("groups");

            console.log("groups are", data);
            res.json({data});
            
        } else {
            res.status(401).json(message)
        }

    }catch(err) {
        console.error(err.message);
    }
}


module.exports.getUserGroupsII = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("userId o in params is", userId);

            const data = await UserModel.findById(userId).select("groups");

            console.log("groups are", data);
            res.json({ groups: data.groups });

    }catch(err) {
        console.error(err.message);
    }
}


module.exports.appendNewGroup = async (req, res) => {
    try {
        const { userId } = req.params;
        const group = req.body;

        const docs = await UserModel.findById(userId).select("groups");

        const groups = docs.groups;

        groups.push(group);
        const data = await UserModel.findByIdAndUpdate(userId, {
            groups
        })

        res.json({data});
        
    } catch(err) {
        console.error(err.message);
    }
}