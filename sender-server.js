const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");

// ✅ Create app FIRST
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// ✅ Middleware AFTER app is created
app.use(express.static(__dirname));

// ✅ Route for home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "sender.html"));
});

// ✅ MongoDB (Atlas OR local)
mongoose.connect(
  "mongodb+srv://USERNAME:PASSWORD@cluster0.mongodb.net/chat"
).then(() => console.log("Sender DB Connected"))
 .catch(err => console.log(err));

// ✅ Message schema
const MessageSchema = new mongoose.Schema({
  sender: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", MessageSchema);

// ✅ Socket logic
io.on("connection", (socket) => {
  console.log("Sender connected");

  socket.on("send_message", async ({ user, msg }) => {
    const message = new Message({ sender: user, text: msg });
    await message.save();
    console.log("Message saved:", msg);
  });
});

// ✅ Start server
server.listen(5000, () => {
  console.log("Sender Server running on http://localhost:5000");
});