import test from "node:test";
import assert from "node:assert/strict";
import { recommendation, inquiryText } from "../public/pricing.mjs";

test("full personal shoot recommends Snjókallinn sjút", () => {
  const result = recommendation({ goal: "confidence", energy: "full", timing: "day", bts: false, extraImages: "0" });
  assert.equal(result.packageId, "editorial");
  assert.equal(result.total, 85000);
});

test("the selected amount of time determines the personal package", () => {
  const result = recommendation({ goal: "reinvention", energy: "full", timing: "day", bts: false, extraImages: "0" });
  assert.equal(result.packageId, "editorial");
  assert.equal(result.total, 85000);
});

test("timing surcharge is calculated from the package price", () => {
  const result = recommendation({ goal: "confidence", energy: "full", timing: "evening", bts: false, extraImages: "5" });
  assert.equal(result.total, 117000);
  assert.deepEqual(result.additions.map(x => x.value), [17000, 15000]);
});

test("BTS is added after the percentage surcharge", () => {
  const result = recommendation({ goal: "reinvention", energy: "production", timing: "evening", bts: true, extraImages: "0" });
  assert.equal(result.packageId, "iconic");
  assert.equal(result.total, 176000);
});

test("each additional image bundle changes the estimate", () => {
  const one = recommendation({ goal: "confidence", energy: "quick", timing: "day", bts: false, extraImages: "1" });
  const five = recommendation({ goal: "confidence", energy: "quick", timing: "day", bts: false, extraImages: "5" });
  const ten = recommendation({ goal: "confidence", energy: "quick", timing: "day", bts: false, extraImages: "10" });
  assert.equal(one.total, 54000);
  assert.equal(five.total, 65000);
  assert.equal(ten.total, 75000);
});

test("business use routes to custom project pricing", () => {
  const result = recommendation({ goal: "business", energy: "quick", timing: "evening", bts: true, extraImages: "10" });
  assert.equal(result.packageId, "custom");
  assert.equal(result.total, null);
});

test("inquiry contains the recommendation and estimate", () => {
  const result = recommendation({ goal: "confidence", energy: "quick", timing: "day", bts: false, extraImages: "0" });
  const text = inquiryText(result, { goalLabel: "góðum myndum af mér", timingLabel: "virkur dagur", bts: false, extraImages: "0" });
  assert.match(text, /Mini sjút/);
  assert.match(text, /50\.000/);
});
