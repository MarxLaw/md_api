const express = require('express');
const cors = require('cors');
const http = require('http');
//const { Server } = require('socket.io');
const mysqlConnection = require('./database/database');

const app = express();
const server = http.createServer(app);
// const io = new Server(server, {
//     cors: {
//         origin: '*',
//     },
// });

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
app.use('/medicine', require('./routes/medicine'));
app.use('/user', require('./routes/users'));



// // Start server
// server.listen(app.get('port') || 8000, () => {
//     console.log('Server on port', app.get('port') || 8000);
// });


const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log('Server running on port', PORT);
});