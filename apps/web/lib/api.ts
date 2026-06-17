import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  withCredentials: true,
});

export function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    return (
      (error.response?.data as { error?: string } | undefined)?.error ??
      error.message
    );
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}
