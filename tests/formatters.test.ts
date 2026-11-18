import { describe, expect, it } from "vitest";
import { formatByteSize } from "../src/lib/formatters";

describe("formatByteSize", () => {
  it("formats raw byte values", () => {
    expect(formatByteSize(512)).toBe("512 B");
  });

  it("formats kilobyte values with one decimal place", () => {
    expect(formatByteSize(2048)).toBe("2.0 KB");
  });

  it("formats megabyte values with two decimal places", () => {
    expect(formatByteSize(3 * 1024 * 1024)).toBe("3.00 MB");
  });
});
