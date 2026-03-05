import jwt from "jsonwebtoken";

const getSecret = () => process.env.JWT_SECRET || "dev_secret_change_me";

export const signToken = (payload: any) => {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, getSecret());
};
