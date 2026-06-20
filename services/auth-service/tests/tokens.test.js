import { test, describe } from "node:test";
import assert from "node:assert";

process.env.JWT_SECRET = "test_secret_for_testing_only";
process.env.ACCESS_TOKEN_TTL = "15m";

const { generateAccessToken, generateRefreshToken } = await import(
  "../src/utils/tokens.js"
);

describe("Token generation", () => {
  test("generateAccessToken returns a string", () => {
    const user = { id: "123", email: "test@example.com" };
    const token = generateAccessToken(user);
    assert.strictEqual(typeof token, "string");
  });

  test("access token has three parts (header.payload.signature)", () => {
    const user = { id: "123", email: "test@example.com" };
    const token = generateAccessToken(user);
    const parts = token.split(".");
    assert.strictEqual(parts.length, 3);
  });

  test("generateRefreshToken returns a 96-character hex string", () => {
    const token = generateRefreshToken();
    assert.strictEqual(token.length, 96);
  });

  test("two refresh tokens are different (randomness)", () => {
    const token1 = generateRefreshToken();
    const token2 = generateRefreshToken();
    assert.notStrictEqual(token1, token2);
  });
});
