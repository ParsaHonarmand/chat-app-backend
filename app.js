const express = require('express')
const app = express();
let moment = require('moment');


let userCounter = 1;
let currentUsers = [];
let currentMessages = [];
const port = process.env.PORT || 3001;

server = app.listen(port, ()=> {
    console.log("server listening on port " + port)
})

let socket = require('socket.io')
io = socket(server)

io.on('connection', (socket) => {
    console.log("Socket ID: " + socket.id)
    // Create a username for the new client 
    // Update list of users
    socket.emit('SEND_USERNAME', "User"+userCounter, () => {
        currentUsers.push([socket.id, "User"+userCounter])
        console.log("current users" + currentUsers[0])
    });
    // currentUsers.push([socket.id,"User"+userCounter]);
    io.sockets.emit('NEW_USER', currentUsers);
    userCounter++;


    socket.on('NEW_USER', (data) => {
        currentUsers.push([socket.id, data])
        io.sockets.emit('NEW_USER', currentUsers);
    })


    // Send message to all clients from one
    socket.on('SEND_MESSAGE', (data) => {
        data.time = moment().format()
        //console.log(data.color)
        io.emit('RECEIVE_MESSAGE', data)
        currentMessages = [...currentMessages, data]
    })

    // Return all the messages to the requesting client
    socket.emit('LIST_OF_PREV_MSG', currentMessages);

    // Check to see if a nickname request is valid or not 
    // Check to see if its unique
    socket.on('VERIFY', (data) => {
        let verifier = true;
        for (let i=0; i<currentUsers.length; i++) {
            if (data.newName === currentUsers[i][1]) {
                socket.emit('VERIFY', false)
                verifier = false;
                break;
            }
        }
        if (data.newName === "") {
            verifier = false;
            socket.emit('VERIFY', false)
        }
        if (verifier === true) {
            let oldName = ""
            for (let i = 0; i<currentUsers.length; i++) {
                if (data.old === currentUsers[i][1]) {
                    console.log("Replacing current users")
                    oldName = currentUsers[i][1]
                    currentUsers[i][1] = data.newName
                }
            }
            for (let i = 0; i<currentMessages.length; i++) {
                console.log(currentMessages[i])
                if (currentMessages[i].author === data.old) {
                    console.log("replacing current messages")
                    currentMessages[i].author = data.newName
                }
            }
            io.sockets.emit('LIST_OF_PREV_MSG', currentMessages);
            io.sockets.emit('NEW_USER', currentUsers);
            socket.emit('VERIFY', true)
        }
    })

    // Change the colour of the users messages
    // Change the colours for everyone
    socket.on('COLOR', (data) => {
        for (let i = 0; i<currentMessages.length; i++) {
            if (data.name === currentMessages[i].author) {
                currentMessages[i].color = data.color
            }
        }
        io.sockets.emit('LIST_OF_PREV_MSG', currentMessages)
    })


    // Check to see if a returning user has their name replaced so far
    socket.on('RETURNING_USER', (data) => {
        let flag = 0;
        for (let i=0; i<currentUsers.length; i++) {
            if (currentUsers[i][1]===data) {
                //make a new name for him
                flag = 1;
                console.log("REPEATED")
                currentUsers.push([socket.id,"User"+userCounter])
                io.sockets.emit('NEW_USER', currentUsers);
                break;
            }
        }
        if (flag===0) {
            currentUsers.push([socket.id, data])
            console.log("This is" + data)
            io.sockets.emit('GET_USERS', currentUsers)
        }
    })

    // If user disconnects, update the list of connected users for all
    socket.on('disconnect', (data) => {
        console.log("Disconnected")
        for (let i =0; i<currentUsers.length; i++) {
            if (currentUsers[i][0]===socket.id) {
                currentUsers.splice(i, 1)
                break;
            }
        }
        //currentUsers.splice(userId, 1);

        console.log(currentUsers)
        io.sockets.emit('SOMEONE_LEFT', currentUsers);
    });
})

