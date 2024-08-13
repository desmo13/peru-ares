const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const FILE_PATH = 'received_file';
const SECRET_KEY = 'supersecretkey';  // Debe ser compartida y segura
const IV_LENGTH = 16;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

const decrypt = (encryptedData, key) => {
    const iv = encryptedData.slice(0, IV_LENGTH);
    const data = encryptedData.slice(IV_LENGTH);
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted;
};

io.on('connection', (socket) => {
    console.log('Cliente conectado.');
    let fileStream = fs.createWriteStream(FILE_PATH);

    socket.on('file-chunk', (encryptedChunk) => {
        const chunk = decrypt(encryptedChunk, SECRET_KEY);
        fileStream.write(chunk);
    });

    socket.on('file-end', () => {
        console.log('Transferencia completa.');
        fileStream.end();
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado.');
    });
});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}.`);
});
