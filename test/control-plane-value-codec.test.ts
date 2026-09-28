import { describe, expect, it } from "vitest";

import {
  normalizeAbiValue,
  normalizeFunctionArguments,
  toJsonSafeContractResult,
} from "@/lib/control-plane/value-codec";

describe("ABI value codec", () => {
  it("keeps large and signed integers as bigint", () => {
    expect(normalizeAbiValue({ name: "amount", type: "uint256" }, "9007199254740993")).toBe(9007199254740993n);
    expect(normalizeAbiValue({ name: "delta", type: "int256" }, "-42")).toBe(-42n);
  });

  it("normalizes booleans and fixed or dynamic arrays", () => {
    expect(normalizeAbiValue({ name: "enabled", type: "bool" }, "true")).toBe(true);
    expect(normalizeAbiValue({ name: "flags", type: "bool[2]" }, '[true,"0"]')).toEqual([true, false]);
    expect(normalizeAbiValue({ name: "amounts", type: "uint256[]" }, '["1","2"]')).toEqual([1n, 2n]);
  });

  it("normalizes tuple objects, positional tuples, and nested tuple arrays", () => {
    const order = {
      name: "order",
      type: "tuple",
      components: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }],
    };
    expect(normalizeAbiValue(order, '{"recipient":"0x1111111111111111111111111111111111111111","amount":"7"}')).toEqual({
      recipient: "0x1111111111111111111111111111111111111111", amount: 7n,
    });
    expect(normalizeAbiValue(order, '["0x1111111111111111111111111111111111111111","8"]')).toEqual([
      "0x1111111111111111111111111111111111111111", 8n,
    ]);
    expect(normalizeAbiValue({ ...order, name: "orders", type: "tuple[]" }, '[{"recipient":"0x1111111111111111111111111111111111111111","amount":"9"}]')).toEqual([
      { recipient: "0x1111111111111111111111111111111111111111", amount: 9n },
    ]);
  });

  it("returns path-aware errors for invalid JSON, array lengths, and nested values", () => {
    expect(() => normalizeAbiValue({ name: "items", type: "uint256[]" }, "not-json")).toThrow("items must contain valid JSON");
    expect(() => normalizeAbiValue({ name: "flags", type: "bool[2]" }, "[true]")).toThrow("flags must contain exactly 2 items");
    expect(() => normalizeAbiValue({
      name: "orders", type: "tuple[]", components: [{ name: "amount", type: "uint256" }, { name: "active", type: "bool" }],
    }, '[{"amount":"not-an-integer","active":true}]')).toThrow("orders[0].amount must be uint256");
  });

  it("normalizes full function arguments and JSON-safe results", () => {
    const method = { inputs: [{ name: "amount", type: "uint256" }, { name: "enabled", type: "bool" }] };
    expect(normalizeFunctionArguments(method, ["12", "1"])).toEqual([12n, true]);
    expect(() => normalizeFunctionArguments(method, ["12"])).toThrow("Function expects 2 arguments, received 1");
    expect(toJsonSafeContractResult({ total: 12n, rows: [1n, { value: 2n }] })).toEqual({ total: "12", rows: ["1", { value: "2" }] });
  });
});
