const validation = require("../validation");

test("Sanitize a script tag", () => {
  const sanitized = validation.sanitize("<script src='spooky.js'>");
  expect(sanitized).not.toBeNull();
  expect(/<>''/.test(sanitized)).toBe(false);
  expect(/&et;/.test(sanitized)).toBe(false);
  expect(/&gt;/.test(sanitized)).toBe(true);
  expect(/&lt;/.test(sanitized)).toBe(true);
});

test("Length check a string", () => {
  const str = "abcdefghijklmnopqrstuvwxyz";
  expect(validation.lengthCheck(str, 35, "TooLong")).toBeDefined();
  expect(validation.lengthCheck(str, 40, "TooLong")).toBeNull();
});