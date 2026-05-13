import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { prisma } from "@repo/db";
import {config} from '@repo/config';

const app = express();

app.use(express.json());

app.get("/",async (req,res)=>{
    const users = await prisma.user.findMany();
    console.log(users);
    res.json(users);

});

app.listen(3003, async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }

  console.log("server is running");
});
