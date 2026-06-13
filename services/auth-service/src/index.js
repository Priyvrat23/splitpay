import express from "express";

const app = express();
const PORT = process.env.PORT || 3001;

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "auth-service",
    uptime: process.uptime(),
  });
});
app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});