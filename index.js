// const express = require('express');
// const mongoose = require('mongoose');
// const cookieParser = require('cookie-parser');
// const dotenv = require('dotenv');
// const jwt = require('jsonwebtoken');
// const cors = require('cors');
// const bcrypt = require('bcrypt');
// const { UserModel } = require('./models/users');
// const Message = require('./models/messages');
// const ws = require('ws');
// const fs = require('fs');

// dotenv.config();
// mongoose.connect(process.env.DB_URI).then((err) => {
//     if(!err) {
//         console.log("connected to DB");
//     }
// })


// const jwtSecret = process.env.JWT_SECRET;
// const bcryptSalt = bcrypt.genSaltSync(10);

// const app = express();
// app.use('/uploads', express.static(__dirname + '/uploads'));
// app.use(express.json());
// app.use(cookieParser());
// app.use(cors({
//   credentials: true,
//   origin: process.env.CLIENT_URL,
// }));

// async function getUserDataFromRequest(req) {
//   return new Promise((resolve, reject) => {
//     const token = req.cookies?.token;
//     if (token) {
//       jwt.verify(token, jwtSecret, {}, (err, userData) => {
//         if (err) throw err;
//         resolve(userData);
//       });
//     } else {
//       reject('no token');
//     }
//   });

// }

// app.get('/test', (req,res) => {
//   res.json('test ok');
// });

// app.get('/messages/:userId', async (req,res) => {
//   const {userId} = req.params;
//   const userData = await getUserDataFromRequest(req);
//   const ourUserId = userData.userId;
//   const messages = await Message.find({
//     sender:{$in:[userId,ourUserId]},
//     recipient:{$in:[userId,ourUserId]},
//   }).sort({createdAt: 1});
//   res.json(messages);
// });

// app.get('/people', async (req,res) => {
//   const users = await User.find({}, {'_id':1,username:1});
//   res.json(users);
// });

// app.get('/profile', (req,res) => {
//   const token = req.cookies?.token;
//   if (token) {
//     jwt.verify(token, jwtSecret, {}, (err, userData) => {
//       if (err) throw err;
//       res.json(userData);
//     });
//   } else {
//     res.status(401).json('no token');
//   }
// });

// app.post('/login', async (req,res) => {
//   const {username, password} = req.body;
//   const foundUser = await UserModel.findOne({username});
//   if (foundUser) {
//     const passOk = bcrypt.compareSync(password, foundUser.password);
//     if (passOk) {
//       jwt.sign({userId:foundUser._id,username}, jwtSecret, {}, (err, token) => {
//         res.cookie('token', token, {sameSite:'none', secure:true}).json({
//           id: foundUser._id,
//         });
//       });
//     }
//   }
// });

// app.post('/logout', (req,res) => {
//   res.cookie('token', '', {sameSite:'none', secure:true}).json('ok');
// });

// app.post('/register', async (req,res) => {
//   const {username,password} = req.body;
//   try {
//     const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
//     const createdUser = await User.create({
//       username:username,
//       password:hashedPassword,
//     });
//     jwt.sign({userId:createdUser._id,username}, jwtSecret, {}, (err, token) => {
//       if (err) throw err;
//       res.cookie('token', token, {sameSite:'none', secure:true}).status(201).json({
//         id: createdUser._id,
//       });
//     });
//   } catch(err) {
//     if (err) throw err;
//     res.status(500).json('error');
//   }
// });

// const server = app.listen(4041);

// const wss = new ws.WebSocketServer({server});
// wss.on('connection', (connection, req) => {

//   function notifyAboutOnlinePeople() {
//     [...wss.clients].forEach(client => {
//       client.send(JSON.stringify({
//         online: [...wss.clients].map(c => ({userId:c.userId,username:c.username})),
//       }));
//     });
//   }

//   connection.isAlive = true;

//   connection.timer = setInterval(() => {
//     connection.ping();
//     connection.deathTimer = setTimeout(() => {
//       connection.isAlive = false;
//       clearInterval(connection.timer);
//       connection.terminate();
//       notifyAboutOnlinePeople();
//       console.log('dead');
//     }, 1000);
//   }, 5000);

//   connection.on('pong', () => {
//     clearTimeout(connection.deathTimer);
//   });

//   // read username and id form the cookie for this connection
//   const cookies = req.headers.cookie;
//   if (cookies) {
//     const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
//     if (tokenCookieString) {
//       const token = tokenCookieString.split('=')[1];
//       if (token) {
//         jwt.verify(token, jwtSecret, {}, (err, userData) => {
//           if (err) throw err;
//           const {userId, username} = userData;
//           connection.userId = userId;
//           connection.username = username;
//         });
//       }
//     }
//   }

//   connection.on('message', async (message) => {
//     const messageData = JSON.parse(message.toString());
//     const {recipient, text, file} = messageData;
//     let filename = null;
//     if (file) {
//       console.log('size', file.data.length);
//       const parts = file.name.split('.');
//       const ext = parts[parts.length - 1];
//       filename = Date.now() + '.'+ext;
//       const path = __dirname + '/uploads/' + filename;
//       const bufferData = new Buffer(file.data.split(',')[1], 'base64');
//       fs.writeFile(path, bufferData, () => {
//         console.log('file saved:'+path);
//       });
//     }
//     if (recipient && (text || file)) {
//       const messageDoc = await Message.create({
//         sender:connection.userId,
//         recipient,
//         text,
//         file: file ? filename : null,
//       });
//       console.log('created message');
//       [...wss.clients]
//         .filter(c => c.userId === recipient)
//         .forEach(c => c.send(JSON.stringify({
//           text,
//           sender:connection.userId,
//           recipient,
//           file: file ? filename : null,
//           _id:messageDoc._id,
//         })));
//     }
//   });

//   // notify everyone about online people (when someone connects)
//   notifyAboutOnlinePeople();
// });

const express = require('express');
require('dotenv').config();
const { connectDB } = require('./config/db-connect');
const app = express();
const userRouter = require('./routers/users');
const groupRouter = require('./routers/groups')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const morgon = require('morgan')
const WebSocket = require('ws');
const jwt = require('jsonwebtoken')
const fs = require('fs');
const MessageModel = require('./models/messages')
const messagesRouter = require('./routers/messages')
const mongoose = require('mongoose');
const { profile } = require('console');

app.use(morgon('dev'))

app.get('/test', (req, res) => {
    res.json({ data: "test is passed" });
})

app.use(cookieParser())

app.use(cors({
    credentials: true,
    origin: '*', //host name of the client URL,

}));

app.use('/uploads', express.static(`${__dirname}/uploads`)) //serve static files
app.use(express.json())
app.use('/', userRouter);
app.use('/messages', messagesRouter)
app.use('/groups', groupRouter)
const PORT = process.env.PORT || 4001;
// connectDB();

const server = app.listen(PORT, () => {

    console.log("server is running and listening on port %s", server.address().port);
})


mongoose.connect(process.env.DB_URI);
mongoose.connection.once('open', () => {
    console.log("connsction stablished successfully on port %s", mongoose.connection.port);
})


// create another server for web socket

const wss = new WebSocket.Server({ server });

wss.on('connection', (connection, req /** grap the req information */) => {

    /**
     * 
     * connection property grap the information of the connected user 
     * 
     * 
     */
        console.log("user tries to connect ...")
        connection.isAlive = true

        const notifyAboutOnlinePeople = () => {
            [...wss.clients].map((client) => {
                // send the information of the online ones
            
                client.send(JSON.stringify(
                    {
                        online: [...wss.clients].map(client => {
                            return { 
                                    userId: client.userId,
                                    username: client.username,
                                    activeStatus: client.activeStatus,
                                    profilePicture: client.profilePicture
                            }
                        })
                    }
                ))
            })
        }

        connection.timer = setInterval(() => {
            connection.ping();
            connection.deathTimer = setTimeout(() => {
              connection.isAlive = false;
              clearInterval(connection.timer);
              connection.terminate();
              console.log("connection clients", [...wss.clients].map(client => client.username));
              notifyAboutOnlinePeople();
              console.log('dead');
            }, 1000);
          }, 5000);
        
          connection.on('pong', () => {
            clearTimeout(connection.deathTimer);
            // console.log("pong recived, user %s is connected", connection.username);
          })


    // // add a timout interval to ping the user after a certain amount of time 
    // connection.timer = setInterval(() => {
    //     //     // the server will send ping message every 5 seconds to check if the client is connected
    //     //     // if the client not respond with pong message then the server will terminate the connection
        
    //     // console.log("send bing  message to  %s", connection.username);
    //     connection.ping();
    //     connection.deathTimer = setTimeout(() => {
    //         connection.isAlive = false;
    //         clearInterval(connection.timer);
    //         connection.terminate() // remove the connection from the wss memory deallocate the reserved spaces
    //         notifyAboutOnlinePeople()
    //         console.log("terminate the connection of %s by the server", connection.username);
           
    //     }, 1000);

    // }, 5000)
   

    // connection.on('pong', () => {
    //     clearTimeout(connection.deathTimer); 
    //     clearInterval(connection.timer)
    
    //     // the client will send a pong message if its alive (connected)
    //     console.log("pong recived %s is connected", connection.username);
    //     // if pong is recived we will deactivate the death timer 
       
    // })

    // connection.pong()



    // console.log("request headers information is", req.headers);

    // see the online users and display them on the frontend 
    // using WebSocket clients property to show all the active clients

    //read username and id from the cookie for this connection  
    const cookies = req.headers.cookie;

    if (cookies) {
        const splitedCookies = cookies.split(';');
        const tokenCookie = splitedCookies.find((cookie) => cookie.includes('token'))
        console.log("token Cookie is", tokenCookie);
        if (tokenCookie) {
            const token = tokenCookie.split('=')[1];
            // console.log("token", token);

            if (token) {

                const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

                console.log("the decoded token", decodedToken);

                /**
                 * save the information of the connected client to connection object
                 * 
                 * mainly connection object is the connection that done between the websoket server and 
                 * the current connected client
                 * 
                 * all the connections for clients will set inside wss (web socket server)
                 * 
                 * the connection object represent the websocket connection to the client
                 */
                const { userId, username, activeStatus, profilePicture } = decodedToken;
                connection.userId = userId;
                connection.username = username;
                connection.activeStatus = activeStatus;
                connection.profilePicture = profilePicture;

            }

        }
    }


    // specify what will happen if the connection send a message 
    connection.on('message', async (message) => {
        message = JSON.parse(message.toString());

        console.log("comming message", message);
        const { recipient, text, file } = message.message;

        let filename = null;
        if (file) {
            // console.log("the sent file: ", file);
            const parts = file.name.split('.');
            const ext = parts[parts.length -1];
            // generate a filename
            filename = `${Date.now()}.${ext}`
            const path = `${__dirname}/uploads/${filename}`

            // decode the data (becuse its base64 encoded)
            // const bufferData = Buffer.alloc(1000,  file.data)
            fs.writeFile(path , file.data.split(',')[1], {encoding: 'base64'}, (err) => {
                if(err) {
                    console.error(err.message);
                } else {
                    console.log("File %s saved ", path);
                }
            })

        }
        // send the message to the destination client
        if (recipient && (text || file)) {

            // save the messages in the database before sending them to the required destanation
            // try {
            const messageDocument = await MessageModel.create({
                sender: connection.userId,
                recipient,
                text,
                file: filename
            });

            console.log(messageDocument);
            // } catch (err) {
            //     console.error(err.message);
            // }

            /** 
            * return all the connections for the destination client becuase,
            * it may be connected on many different devoces at the same time,
            * so we use filter insted of find
            **/
            [...wss.clients].filter(client => client.userId === recipient).forEach(client =>
                client.send(JSON.stringify({
                    text,
                    sender: connection.userId,
                    recipient,
                    _id: messageDocument._id,
                    file: messageDocument.file
                }))
            )
        }
    })

    // grap the all client from the wss an see who is online
    /***
     * the length below will be 2 even I have only one coonection in development mode
     * this is because in development mode react app will render every component twice
     * and so it will return 2 connection 
     */
    console.log("clients numbers", [...wss.clients].length); // return object of clients, transform the oject to array using spred operator

    console.log("clients are", [...wss.clients].map(connection => connection.username));

    // return the online users to the specified clients
    // notify everyone about the online people(when somone connects)
    notifyAboutOnlinePeople();


    // console.log("connecting successfully");

    // connection.send("Hello My Friend");

});