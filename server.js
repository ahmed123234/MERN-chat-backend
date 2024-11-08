const express = require('express');
require('dotenv').config();
const { connectDB } = require('./config/db-connect');
const app = express();
const userRouter = require('./routers/users');
const groupRouter = require('./routers/groups')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const morgon = require('morgan')
const messagesRouter = require('./routers/messages')
const mongoose = require('mongoose');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken')
const fs = require('fs');
const MessageModel = require('./models/messages')
// const { wss } = require('./websocket-server')

app.use(morgon('dev'))

app.get('/test', (req, res) => {
    res.json({ data: "test is passed" });
})

app.use(cookieParser())

app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL, //host name of the client URL,

}));

app.use('/uploads', express.static(`${__dirname}/uploads`)) //serve static files
app.use(express.json())
app.use('/', userRouter);
app.use('/messages', messagesRouter)
app.use('/groups', groupRouter)


const PORT = process.env.PORT;

const server = app.listen(PORT, () => {

    connectDB();
    console.log("server is running and listening on port %s", server.address().port);
})


// create another server for web socket
const wss = new WebSocket.Server({ server });

wss.on('connection', (connection, req /** grap the req information */) => {

    /**
     * connection property grap the information of the connected user 
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