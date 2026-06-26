import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(48).toString("hex");
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
