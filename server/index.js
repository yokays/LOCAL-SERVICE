const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { init } = require('./db');
const config = require('./config');

// Init DB
init();

// Ensure upload dir exists
fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

app.set('io', io);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/clients', require('./routes/clients'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/users', require('./routes/users'));
app.use('/api/config', require('./routes/users'));

// Socket.io
io.on('connection', (socket) => {
  console.log(`[Socket.io] Connecté: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Déconnecté: ${socket.id}`);
  });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

server.listen(config.PORT, () => {
  console.log(`Serveur LSA démarré sur http://localhost:${config.PORT}`);
});
