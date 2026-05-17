import express, { type Router } from "express";
import { LoginUserSchema, RegisterUserSchema } from "@repo/schemas-types"
import { prisma } from "@repo/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "@repo/config";

export const authRouter: Router = express.Router();

authRouter.post("/signup", async (req, res) => {
    try {

        const result = RegisterUserSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error.message });
        }
        const { username, email, password } = result.data;
        const existing = await prisma.user.findUnique({
            where: {
                email
            }
        })
        if (existing) {
            return res.status(409).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                name: username,
                email,
                password: hashedPassword
            }
        });
        const token = jwt.sign({ id: newUser.id, email: newUser.email, }, config.JWT_SECRET, {
            expiresIn: "1d",
        });

        res.cookie("jwt", token, {
            maxAge: 24 * 60 * 60 * 1000, // MS
            httpOnly: true, // prevent XSS attacks: cross-site scripting
            sameSite: "strict", // CSRF attacks
            secure: config.NODE_ENV === "development" ? false : true,
        });
        res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

authRouter.post("/login", async (req, res) => {
  try {
    const result = LoginUserSchema.safeParse(req.body)

    if (!result.success) {
      return res.status(400).json({
        errors: result.error.message,
      })
    }

    const { email, password } = result.data

    const existingUser =await prisma.user.findUnique({
        where: { email },
      })

    if (!existingUser) {
      return res.status(401).json({
        error: "Invalid credentials",
      })
    }

    const isPasswordCorrect = await bcrypt.compare(
        password,
        existingUser.password
      )

    if (!isPasswordCorrect) {
      return res.status(401).json({
        error: "Invalid credentials",
      })
    }

    const token = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
      },
      config.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    )

    res.cookie("jwt", token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure:config.NODE_ENV !== "development",
    })

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        balance: existingUser.balance,
      },
    })

  } catch (err) {
    console.error("Login error:", err)

    return res.status(500).json({error: "Internal server error"})
  }
})