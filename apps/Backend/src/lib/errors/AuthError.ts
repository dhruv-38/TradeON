import { AppError } from "./AppError.js";

export class AuthError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}