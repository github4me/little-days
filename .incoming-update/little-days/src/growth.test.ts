import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { referenceSeries, type GrowthMetric } from "./growth";

describe("WHO reference integrity", () => {
  for (const metric of ["weight", "length", "head"] as GrowthMetric[]) {
    for (const sex of ["male", "female"] as const) {
      it(`${metric}/${sex} has ordered monthly age and percentile values`, () => {
        const points = referenceSeries(metric, sex);
        assert.equal(points.length, 25);
        points.forEach((p, i) => {
          assert.equal(p.months, i);
          assert.ok(p.p3 > 0);
          assert.ok(p.p15 > p.p3);
          assert.ok(p.p50 > p.p15);
          assert.ok(p.p85 > p.p50);
          assert.ok(p.p97 > p.p85);
        });
      });
    }
  }
  it("matches independent published WHO birth table anchor values", () => {
    assert.deepEqual(referenceSeries("weight", "male")[0], {
      months: 0,
      p3: 2.5,
      p15: 2.9,
      p50: 3.3,
      p85: 3.9,
      p97: 4.3,
    });
    assert.deepEqual(referenceSeries("head", "female")[0], {
      months: 0,
      p3: 31.7,
      p15: 32.7,
      p50: 33.9,
      p85: 35.1,
      p97: 36.1,
    });
    assert.equal(referenceSeries("length", "male")[0].p50, 49.9);
  });
  it("does not infer sex or extrapolate age", () => {
    assert.deepEqual(referenceSeries("weight", "unspecified"), []);
    assert.equal(referenceSeries("weight", "male", 99).length, 25);
    assert.equal(referenceSeries("weight", "male", 3).length, 4);
    assert.deepEqual(referenceSeries("weight", "male", -1), []);
    assert.deepEqual(referenceSeries("weight", "male", NaN), []);
  });
  it("callers cannot mutate bundled references", () => {
    const points = referenceSeries("weight", "male");
    points[0].p50 = 999;
    assert.equal(referenceSeries("weight", "male")[0].p50, 3.3);
  });
});
