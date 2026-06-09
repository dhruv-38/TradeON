export type AuthUser = {
  id: number;
  name: string;
  email: string;
  walletid?: number;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  user: AuthUser;
};

export type SignupPayload = {
  username: string;
  email: string;
  password: string;
};

export type SignupResponse = {
  message: string;
  user: AuthUser;
};
