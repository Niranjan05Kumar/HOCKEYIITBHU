// For Server Setup
import express from "express";
import connectDB from "./config/database.js";
import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT || 5000;

connectDB();
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});