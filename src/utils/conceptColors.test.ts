import {
  EVENT_TYPE_COLORS,
  DAY_COLORS,
  EXPERIENCE_COLORS,
} from "./conceptColors";

const ALL_EVENT_TYPE_CODES = [
  "ANI",
  "BGM",
  "CGM",
  "EGM",
  "ENT",
  "FLM",
  "HMN",
  "KID",
  "LRP",
  "MHE",
  "NMN",
  "RPG",
  "SEM",
  "SPA",
  "TCG",
  "TDA",
  "TRD",
  "WKS",
  "ZED",
] as const;

describe("EVENT_TYPE_COLORS", () => {
  it.each(ALL_EVENT_TYPE_CODES)("maps %s to a color entry", (code) => {
    expect(EVENT_TYPE_COLORS[code]).toMatchObject({
      color: expect.stringMatching(/^#[0-9a-f]{6}$/),
      bg: expect.stringMatching(/^#[0-9a-f]{6}$/),
    });
  });

  it("maps RPG, LRP, TDA to the roleplay family", () => {
    expect(EVENT_TYPE_COLORS["RPG"]).toEqual(EVENT_TYPE_COLORS["LRP"]);
    expect(EVENT_TYPE_COLORS["RPG"]).toEqual(EVENT_TYPE_COLORS["TDA"]);
    expect(EVENT_TYPE_COLORS["RPG"].color).toBe("#5c3a7a");
  });

  it("maps BGM, CGM, TCG to the board & card family", () => {
    expect(EVENT_TYPE_COLORS["BGM"]).toEqual(EVENT_TYPE_COLORS["CGM"]);
    expect(EVENT_TYPE_COLORS["BGM"].color).toBe("#2a5c3a");
  });

  it("maps HMN, NMN, MHE to the miniatures family", () => {
    expect(EVENT_TYPE_COLORS["HMN"]).toEqual(EVENT_TYPE_COLORS["NMN"]);
    expect(EVENT_TYPE_COLORS["HMN"].color).toBe("#1a3d5c");
  });
});

describe("DAY_COLORS", () => {
  it.each(["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])(
    "maps %s to a color entry",
    (day) => {
      expect(DAY_COLORS[day]).toMatchObject({
        color: expect.stringMatching(/^#[0-9a-f]{6}$/),
        bg: expect.stringMatching(/^#[0-9a-f]{6}$/),
      });
    },
  );

  it("maps Thursday to amber", () => {
    expect(DAY_COLORS["Thursday"].color).toBe("#7a4a00");
  });
});

describe("EXPERIENCE_COLORS", () => {
  it("maps the full None string to green", () => {
    expect(
      EXPERIENCE_COLORS[
        "None (You've never played before - rules will be taught)"
      ].color,
    ).toBe("#2a5c3a");
  });

  it("maps the full Some string to amber", () => {
    expect(
      EXPERIENCE_COLORS[
        "Some (You've played it a bit and understand the basics)"
      ].color,
    ).toBe("#7a4a00");
  });

  it("maps the full Expert string to rose", () => {
    expect(
      EXPERIENCE_COLORS["Expert (You play it regularly and know all the rules)"]
        .color,
    ).toBe("#7a2040");
  });
});
