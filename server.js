const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const translate = require("google-translate-api-x");
const path = require("path");

// ===== MongoDB Model =====
const MessageSchema = new mongoose.Schema({
  sender: String,
  text: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model("Message", MessageSchema);

// ===== App Setup =====
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ===== MongoDB Connection =====
mongoose.connect("mongodb://127.0.0.1:27017/chat")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ===== Store User Languages =====
const userLanguages = {};

// ===== Socket.IO =====
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Default language
  userLanguages[socket.id] = "en";

  socket.on("set_language", (lang) => {
    userLanguages[socket.id] = lang;
  });

  socket.on("send_message", async ({ user, msg }) => {

    // Save original message
    const newMessage = new Message({
      sender: user,
      text: msg
    });
    await newMessage.save();

    // Send translated message to each user
    for (const [id, sock] of io.sockets.sockets) {

      const targetLang = userLanguages[id] || "en";

      try {
        const translated = await translate(msg, { to: targetLang });

        sock.emit("receive_message", {
          user,
          translatedMsg: translated.text
        });

      } catch (err) {
        sock.emit("receive_message", {
          user,
          translatedMsg: msg
        });
      }
    }
  });

  socket.on("disconnect", () => {
    delete userLanguages[socket.id];
    console.log("User disconnected:", socket.id);
  });
});

// ===== Start Server =====
server.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});