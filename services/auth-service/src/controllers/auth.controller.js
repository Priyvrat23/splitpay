import bcrypt from "bcrypt";
import { query } from "../db.js";
import redis from "../redis.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from "../validators/auth.validators.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokens.js";

const BCRYPT_COST = 12;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export const register = async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((i) => i.message),
      });
    }

    const { email, password, full_name } = result.data;

    const existing = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "An account with this email already exists",
      });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_COST);

    const newUser = await query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, avatar_color, created_at`,
      [email, password_hash, full_name]
    );

    return res.status(201).json({
      message: "Account created successfully",
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({
      error: "Something went wrong. Please try again.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((i) => i.message),
      });
    }

    const { email, password } = result.data;

    const found = await query(
      "SELECT id, email, password_hash, full_name, avatar_color FROM users WHERE email = $1",
      [email]
    );

    if (found.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = found.rows[0];

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    await redis.set(
      `auth:refresh:${user.id}:${refreshToken}`,
      Date.now(),
      "EX",
      REFRESH_TOKEN_TTL_SECONDS
    );

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_color: user.avatar_color,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

export const refresh = async (req, res) => {
  try {
    const result = refreshSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((i) => i.message),
      });
    }

    const { refreshToken } = result.data;

    const keys = await redis.keys(`auth:refresh:*:${refreshToken}`);

    if (keys.length === 0) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const storedKey = keys[0];
    const userId = storedKey.split(":")[2];

    const found = await query(
      "SELECT id, email, full_name, avatar_color FROM users WHERE id = $1",
      [userId]
    );

    if (found.rows.length === 0) {
      await redis.del(storedKey);
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const user = found.rows[0];

    await redis.del(storedKey);

    const newRefreshToken = generateRefreshToken();
    await redis.set(
      `auth:refresh:${user.id}:${newRefreshToken}`,
      Date.now(),
      "EX",
      REFRESH_TOKEN_TTL_SECONDS
    );

    const newAccessToken = generateAccessToken(user);

    return res.status(200).json({
      message: "Token refreshed",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

export const logout = async (req, res) => {
  try {
    const result = logoutSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((i) => i.message),
      });
    }

    const { refreshToken } = result.data;

    const keys = await redis.keys(`auth:refresh:*:${refreshToken}`);

    for (const key of keys) {
      await redis.del(key);
    }

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};