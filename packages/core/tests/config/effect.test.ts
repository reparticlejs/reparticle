import { describe, expect, it } from "vitest";
import skeleton from "../../../../docs/effect.example.json";
import { parseEffectConfig } from "#src/config/effect.js";
import { ZodError } from "zod";
import { effectConfigSchema } from "#src/config/schema.js";

function expectIssue(input: unknown, path: (string | number)[], code?: string): void {
  const result = effectConfigSchema.safeParse(input);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path, ...(code ? { code } : {}) })]),
    );
  }
}

const example = () => JSON.parse(JSON.stringify(skeleton));

describe("effect JSON boundary", () => {
  it("validates the documented skeleton and returns independent nested data", () => {
    const input = example();
    const parsed = parseEffectConfig(input);
    expect(parsed).toEqual(input);
    input.emitters[0].initial.speed = 0;
    input.emitters[0].emission.shape.type = "box";
    expect(parsed.emitters[0].initial.speed).toBe(220);
    expect(parsed.emitters[0].emission.shape.type).toBe("point");
  });

  it.each([null, [], "{}", {}, { version: 2, emitters: [] }])(
    "rejects malformed roots and unsupported versions: %j",
    (input) => {
      expect(() => parseEffectConfig(input)).toThrow(ZodError);
    },
  );

  it("rejects unsupported features rather than dropping them", () => {
    const input = example();
    input.emitters[0].modifiers.vortex = {};
    expectIssue(input, ["emitters", 0, "modifiers"], "unrecognized_keys");
    delete input.emitters[0].modifiers.vortex;
    input.emitters[0].emission.shape.type = "circle";
    expectIssue(input, ["emitters", 0, "emission", "shape", "type"], "invalid_value");
    input.emitters.push(input.emitters[0]);
    expectIssue(input, ["emitters"], "too_big");
  });

  it.each([NaN, Infinity, -1, "3000", () => 3000])(
    "rejects invalid rates without coercion",
    (rate) => {
      const input = example();
      input.emitters[0].emission.rate = rate;
      expectIssue(input, ["emitters", 0, "emission", "rate"]);
    },
  );

  it.each([
    ["capacity", 0],
    ["capacity", 1.5],
    ["capacity", 1_000_001],
    ["seed", -1],
    ["seed", 1.5],
    ["seed", 65536],
    ["id", " "],
  ])("rejects invalid %s", (key, value) => {
    const input = example();
    input.emitters[0][key] = value;
    expectIssue(input, ["emitters", 0, key]);
  });

  it("rejects missing and misspelled nested properties", () => {
    const input = example();
    delete input.emitters[0].initial.lifetime;
    expectIssue(input, ["emitters", 0, "initial", "lifetime"], "invalid_type");
    input.emitters[0].initial.lifetime = 0;
    expectIssue(input, ["emitters", 0, "initial", "lifetime"], "too_small");
    input.emitters[0].initial.lifetime = 2;
    input.emitters[0].initial.speeed = 1;
    expectIssue(input, ["emitters", 0, "initial"], "unrecognized_keys");
  });
});
