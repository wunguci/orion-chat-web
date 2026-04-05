import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import multer from "multer";
import { mkdirSync } from "fs";

const app = express();
app.use(cors({ origin: "*" }));

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, "../dist");

// Tạo thư mục uploads nếu chưa có
const uploadDir = join(__dirname, "../uploads");
mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 10MB
});

// Serve thư mục uploads để client truy cập file
app.use("/uploads", express.static(uploadDir));

// Endpoint upload file
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    name: req.file.originalname,
    type: req.file.mimetype,
  });
});
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(">>> Kết nối mới:", socket.id);

  socket.on("register", ({ userId, username }) => {
    onlineUsers.set(socket.id, { userId, username });
    io.emit("online_users", Array.from(onlineUsers.values()));
    console.log(`[+] ${username} online`);
  });

  socket.on("send_message", (data) => {
    io.emit("receive_message", {
      ...data,
      id: Date.now().toString(),
      fileUrl: data.fileUrl ? data.fileUrl : undefined,
    });
  });

  socket.on("disconnect", () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      console.log(`[-] ${user.username} offline`);
      onlineUsers.delete(socket.id);
      io.emit("online_users", Array.from(onlineUsers.values()));
    }
  });
});

app.get("/health", (_, res) =>
  res.json({ status: "ok", users: onlineUsers.size }),
);

// Serve frontend - phải đặt CUỐI CÙNG để không chặn các route khác
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*splat", (_, res) => res.sendFile(join(distPath, "index.html")));
}

server.listen(8080, () =>
  console.log("✅ Server chạy tại http://localhost:8080"),
);
