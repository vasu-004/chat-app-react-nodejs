const express = require("express");
const cors = require("cors");
const { Pool } = require("pg"); // PostgreSQL client
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const socket = require("socket.io");
require("dotenv").config();

app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Test DB connection
pool.connect()
  .then(() => console.log("PostgreSQL DB Connection Successful"))
  .catch((err) => console.log("DB Connection Error:", err));

// Make pool available globally (for routes)
global.db = pool;

app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

app.use("/api/auth", authRoutes);       // login/signup routes
app.use("/api/messages", messageRoutes); // chat message routes

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);

const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
