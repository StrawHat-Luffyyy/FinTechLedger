import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import apiRoutes from "./routes/api.js";
import authRoutes from "./routes/authRoutes.js"; // Import Auth Routes
import { protect } from "./middlewares/authMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Mount Routes
app.use("/auth", authRoutes);

// Protected Routes (Apply middleware)
app.use("/api", protect, apiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
startServer();
