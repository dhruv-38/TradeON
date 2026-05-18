import { config } from '@repo/config';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthError } from '../lib/errors/AuthError.js';
import { prisma } from '@repo/db';

interface JwtPayload {
    id: number;
    email: string;
}

export const protectRoute = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.jwt;
    if (!token) {
        throw new AuthError("Unauthorized");
    }
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id,
            },
        });
        if (!user) { throw new AuthError("User not found"); }
        req.user = {
            id: user.id,
            email: user.email,
        };
        next(); 
    } catch (error) {
        next(error);
    }
};