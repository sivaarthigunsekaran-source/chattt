const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const translate = require("google-translate-api-x");

const app = express();
const server = http.createServer(app);
const path = require("path");
app.use(express.static(__dirname));
const io = socketIo(server);
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "receiver.html"));
});

// MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/chat")
  .then(() => console.log("Receiver DB Connected"));

const Message = mongoose.model(
  "Message",
  new mongoose.Schema({}, { strict: false })
);

io.on("connection", (socket) => {
  console.log("Receiver connected");

  socket.on("set_language", (lang) => {
    socket.lang = lang;
  });

  setInterval(async () => {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(1);

    if (messages.length === 0) return;

    const lastMessage = messages[0];

    try {
      const translated = await translate(lastMessage.text, {
        to: socket.lang || "en"
      });

      socket.emit("receive_message", {
        user: lastMessage.sender,
        msg: translated.text
      });

    } catch {
      socket.emit("receive_message", {
        user: lastMessage.sender,
        msg: lastMessage.text
      });
    }

  }, 2000); // checks every 2 seconds
});

server.listen(7000, () => {
  console.log("Receiver Server running on http://localhost:7000");
});