import { config } from "@repo/config";
import { createUser, userExist } from "./auth.repository.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LoginUserInput, RegisterUserInput } from "@repo/schemas-types";
import { ConflictError } from "../../lib/errors/ConflictError.js";
import { AuthError } from "../../lib/errors/AuthError.js";

export const signupAuthService = async (data:RegisterUserInput)=>{
    const { username, email, password } = data;
        const existing = await userExist(email)
        if (existing) {
            throw new ConflictError("User already exists")
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const {newUser, wallet} = await createUser(username, email,hashedPassword);
        const token = jwt.sign({ id: newUser.id, email: newUser.email, }, config.JWT_SECRET, {
            expiresIn: "1d",
        });
        return {token, newUser,wallet};
};

export const loginAuthService = async (data:LoginUserInput)=>{
    const { email, password } = data

    const existingUser =await userExist(email)

    if (!existingUser) {
      throw new AuthError("Invalid Credentials");
    }

    const isPasswordCorrect = await bcrypt.compare(
        password,
        existingUser.password
      )

    if (!isPasswordCorrect) {
      throw new Error("Invalid Credentials");
    }

    const token = jwt.sign(
        { id: existingUser.id, email: existingUser.email }, 
        config.JWT_SECRET,
        {expiresIn: "1d",})
        
    return {token,existingUser};
};