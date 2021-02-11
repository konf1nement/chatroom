const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./public/utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./public/utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Set statiic folder
app.use(express.static(path.join(__dirname, 'public')));

const admin = 'Admin'

//Run when client connects
io.on('connection', socket => {

    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //Welcome current user
        socket.emit('message', formatMessage(admin, 'Welcome to MarketChat'));

        //Broadcast when a user connects
        socket.broadcast
            .to(user.room)
            .emit('message',formatMessage(admin, `${user.username} has joined the chat`));

        //Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    //Listen for chat value
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    })

    //Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
    
        if(user){
          io.to(user.room).emit(
            'message',
            formatMessage(admin, `${user.username} has left the chat`)
          );

          io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
          });
        }

        //
      });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));