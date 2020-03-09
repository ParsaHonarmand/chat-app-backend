const express = require('express')
const app = express();
let moment = require('moment');


let userCounter = 1;
let currentUsers = [];
let currentMessages = [];

server = app.listen(8080, ()=> {
    console.log("server listening on port 3000")
})

let socket = require('socket.io')
io = socket(server)

io.on('connection', (socket) => {
    console.log(socket.id)
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
    socket.on('SEND_MESSAGE', (data) => {
        data.time = moment().format()
        console.log(data.color)
        io.emit('RECEIVE_MESSAGE', data)
        currentMessages = [...currentMessages, data]
    })

    socket.emit('LIST_OF_PREV_MSG', currentMessages);

    socket.on('VERIFY', (data) => {
        let verifier = true;
        for (let i=0; i<currentUsers.length; i++) {
            if (data.newName === currentUsers[i][1]) {
                socket.emit('VERIFY', false)
                verifier = false;
                break;
            }
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

    socket.on('COLOR', (data) => {
        for (let i = 0; i<currentMessages.length; i++) {
            if (data.name === currentMessages[i].author) {
                currentMessages[i].color = data.color
            }
        }
        io.sockets.emit('LIST_OF_PREV_MSG', currentMessages)
    })

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

