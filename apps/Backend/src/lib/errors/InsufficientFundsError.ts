import { AppError } from "./AppError.js";

export class InsufficientFundsError extends AppError {
    constructor(message = "Insufficient funds") {
        super(message, 400);
    }
}