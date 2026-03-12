import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({ origin: '*' }));

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, '../dist');

// Serve frontend build nếu đã có
if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*splat', (_, res) => res.sendFile(join(distPath, 'index.html')));
}
const server = createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('>>> Kết nối mới:', socket.id);

    socket.on('register', ({ userId, username }) => {
        onlineUsers.set(socket.id, { userId, username });
        io.emit('online_users', Array.from(onlineUsers.values()));
        console.log(`[+] ${username} online`);
    });

    socket.on('send_message', (data) => {
        io.emit('receive_message', { ...data, id: Date.now().toString() });
    });

    socket.on('disconnect', () => {
        const user = onlineUsers.get(socket.id);
        if (user) {
            console.log(`[-] ${user.username} offline`);
            onlineUsers.delete(socket.id);
            io.emit('online_users', Array.from(onlineUsers.values()));
        }
    });
});

app.get('/health', (_, res) =>
    res.json({ status: 'ok', users: onlineUsers.size }),
);

server.listen(3001, () =>
    console.log('✅ Server chạy tại http://localhost:3001'),
);
