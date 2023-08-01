const {GroupModel }= require('../models/groups')
const {UserModel} = require('../models/users')
const fs = require('fs');

module.exports.createGroup = async (req, res) => {
    try {
        const { name, members, profilePicture } = req.body;

        const group = await GroupModel.create({
            name,
            members
        })
        const { _id, name: groupName , members: groupMembrs, chatColor, chatEmoji } = group;
        const filename = `${_id}.png`;
        const filePath = `${__dirname}/../uploads/profile_pictures/`;
        const data = profilePicture.split(',')[1];
        
        fs.writeFile(`${filePath}${filename}`, data, {encoding: 'base64'}, async (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log("saved successfully", filename);

               await GroupModel.findByIdAndUpdate(_id, {
                    profilePicture: filename
                })
               
                res.json({ _id, name, members: groupMembrs, profilePicture: filename, chatColor, chatEmoji });
            }
        })


        
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message })
    }

}

module.exports.updateChatColor = async (req, res) => {
    try {
      const { groupId } = req.params
      const {chatColor} = req.body

      await GroupModel.findByIdAndUpdate(groupId, {
        chatColor
      })
     const group = await GroupModel.findById(groupId);

     group.members.forEach(async ({userId}) => {
       const doc = await UserModel.findById(userId).select('groups');
       const userGroups = doc.groups;
       console.log("user groups", userGroups);
       const currentGroup =  userGroups.find((gr) => {
        return gr.name === group.name
       });
       console.log("current group", currentGroup );

       currentGroup.chatColor = chatColor ;

       console.log("current group after updating", currentGroup, userGroups );


       const index = doc.groups.indexOf(currentGroup);

       console.log("index is ", index);
       userGroups.splice(index, 1, group);

       console.log(userGroups);

       
        UserModel.findByIdAndUpdate(userId, {
            groups: userGroups
        })
        
     })
     
     res.json(group);

    } catch(err) {
        console.error(err.message);
        res.status(500).json({error: err.message});
    }
}


module.exports.updateChatEmoji = async (req, res) => {
    try {
      const { groupId } = req.params
      const {chatEmoji} = req.body

      await GroupModel.findByIdAndUpdate(groupId, {
        chatEmoji
      })

      const group = await GroupModel.findById(groupId);

      group.members.forEach(async ({userId}) => {
        const doc = await UserModel.findById(userId).select('groups');
        const userGroups = doc.groups;
        console.log("user groups", userGroups);
        const currentGroup =  userGroups.find((gr) => {
         return gr.name === group.name
        });
        console.log("current group", currentGroup );
 
        currentGroup.chatEmoji = chatEmoji;
 
        // console.log("current group after updating", currentGroup, userGroups );
 
 
        const index = doc.groups.indexOf(currentGroup);
 
        console.log("index is ", index);
        userGroups.splice(index, 1);
 
        console.log(userGroups, "now ");
 
        
         UserModel.findByIdAndUpdate(userId, {
            $set: {
                'groups': userGroups
            }
         })



         
      })

      res.json(group);

    } catch(err) {
        console.error(err.message);
        res.status(500).json({error: err.message});
    }
}

module.exports.getAllGroups = async (req, res) => {
    try {

        const { userId } = req.params;
        console.log("userId of the current user", userId);

        const groups = await GroupModel.find({
            // members
            // $where: {
                
            // }
        });

        const userGroups = groups.filter(group => group.members.includes(member => member === userId))

        console.log("groups for user", userId, userGroups);
        res.json(userGroups);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message })
    }

}


module.exports.getGroups = async (req, res) => {
    try {

        const groups = await GroupModel.find({
            // members
            // $where: {
                
            // }
        });

        res.json({groups});

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message })
    }

}

module.exports.deleteGroups = async (req, res) => {
    try {

        const groups = await GroupModel.deleteMany({
           
        });

        res.json({groups});

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message })
    }

}