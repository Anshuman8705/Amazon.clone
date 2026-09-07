import { describe, it, expect } from "vitest";
import { cartReducer, MAX_QTY } from "../context/CartContext.jsx";

describe("cartReducer", () => {
  it("adds a new line", () => {
    expect(cartReducer([], { type: "add", id: 1, qty: 2 })).toEqual([{ id: 1, qty: 2 }]);
  });
  it("merges quantity when the same product is added twice", () => {
    const s1 = cartReducer([], { type: "add", id: 1, qty: 2 });
    expect(cartReducer(s1, { type: "add", id: 1, qty: 3 })).toEqual([{ id: 1, qty: 5 }]);
  });
  it("caps quantity at MAX_QTY", () => {
    const s1 = cartReducer([], { type: "add", id: 1, qty: 8 });
    expect(cartReducer(s1, { type: "add", id: 1, qty: 8 })[0].qty).toBe(MAX_QTY);
  });
  it("setQty below 1 removes the line", () => {
    const s1 = cartReducer([], { type: "add", id: 1, qty: 1 });
    expect(cartReducer(s1, { type: "setQty", id: 1, qty: 0 })).toEqual([]);
  });
  it("replace adopts server lines and drops empties", () => {
    expect(cartReducer([{ id: 1, qty: 1 }], { type: "replace", lines: [{ id: "2", qty: 3 }, { id: 3, qty: 0 }] })).toEqual([{ id: 2, qty: 3 }]);
  });
  it("removes and clears", () => {
    const s = [{ id: 1, qty: 1 }, { id: 2, qty: 4 }];
    expect(cartReducer(s, { type: "remove", id: 1 })).toEqual([{ id: 2, qty: 4 }]);
    expect(cartReducer(s, { type: "clear" })).toEqual([]);
  });
});
