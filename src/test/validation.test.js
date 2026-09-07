import { describe, it, expect } from "vitest";
import { luhn, validateCheckout, formatCardNumber, formatExpiry, expiryError } from "../utils/validation.js";

const good = {
  name: "Vikram S",
  email: "vikram@example.com",
  address: "12 Station Road",
  city: "Nanded",
  state: "MH",
  zip: "431601",
  cardName: "VIKRAM S",
  card: "4242 4242 4242 4242",
  expiry: "12/40",
  cvv: "123",
};

describe("luhn", () => {
  it("accepts the standard test card", () => expect(luhn("4242424242424242")).toBe(true));
  it("rejects a mistyped card", () => expect(luhn("4242424242424241")).toBe(false));
  it("rejects short input", () => expect(luhn("1234")).toBe(false));
});

describe("formatters", () => {
  it("groups card digits in fours", () => expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242"));
  it("inserts the slash in an expiry", () => expect(formatExpiry("1240")).toBe("12/40"));
});

describe("expiryError", () => {
  const now = new Date(2026, 8, 6);
  it("flags an expired card", () => expect(expiryError("08/26", now)).toBe("That card has expired"));
  it("accepts the current month", () => expect(expiryError("09/26", now)).toBe(""));
  it("rejects month 13", () => expect(expiryError("13/30", now)).toMatch(/Month/));
});

describe("validateCheckout", () => {
  it("passes a complete form", () => expect(validateCheckout(good)).toEqual({}));
  it("reports every missing field", () => {
    const empty = Object.fromEntries(Object.keys(good).map((k) => [k, ""]));
    expect(Object.keys(validateCheckout(empty)).sort()).toEqual(Object.keys(good).sort());
  });
  it("rejects a bad email and postal code", () => {
    const err = validateCheckout({ ...good, email: "nope", zip: "12" });
    expect(err.email).toBeDefined();
    expect(err.zip).toBeDefined();
    expect(Object.keys(err)).toHaveLength(2);
  });
});
