const validation = require("../validation");

describe("Libs: validation", () => {
  describe("Validation: sanitize", () => {
    test("Sanitizes a script tag of potentially malicious HTML elements", () => {
      const sanitized = validation.sanitize("<script src='spooky.js'>");
      expect(sanitized).not.toBeNull();
      expect(/<>''/.test(sanitized)).toBe(false);
      expect(/&et;/.test(sanitized)).toBe(false);
      expect(/&gt;/.test(sanitized)).toBe(true);
      expect(/&lt;/.test(sanitized)).toBe(true);
    });
  });
  describe("Validation: lengthCheck", () => {
    test("Checks the length of a string and returns a formatted error", () => {
      const str = "abcdefghijklmnopqrstuvwxyz";
      expect(validation.lengthCheck(str, 35, "TooLong")).toBeDefined();
      expect(validation.lengthCheck(str, 40, "TooLong")).toBeNull();
    });
  })
});
