import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running" });
});

app.use("/api/user", userRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
