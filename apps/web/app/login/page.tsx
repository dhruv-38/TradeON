"use client";

import { useState } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";

export default function LoginPage() {
    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const setAuth =
        useAuthStore(
            (state) => state.setUser
        );

    const handleLogin =
        async () => {
            try {
                const response =
                    await api.post(
                        "/auth/login",
                        {
                            email,
                            password,
                        }
                    );

                console.log(response.data);

                setAuth(
                    response.data.user
                );

                alert("Login Success");
            } catch (err) {
                console.error(err);
            }
        };

    return (
        <div
            style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                maxWidth: 300,
            }}
        >
            <h1>Login</h1>

            <input
                placeholder="Email"
                value={email}
                onChange={(e) =>
                    setEmail(e.target.value)
                }
            />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                    setPassword(e.target.value)
                }
            />

            <button
                onClick={handleLogin}
            >
                Login
            </button>
        </div>
    );
}