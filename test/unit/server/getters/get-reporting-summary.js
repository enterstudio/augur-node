"use strict";

const assert = require("chai").assert;
const setupTestDb = require("../../test.database");
const {getReportingSummary, extractGetReportingSummaryParams} = require("../../../../src/server/getters/get-reporting-summary");

describe("server/getters/get-reporting-summary", () => {
  const test = (t) => {
    it(t.description, (done) => {
      setupTestDb((err, db) => {
        assert.ifError(err);
        const paramsExtracted = extractGetReportingSummaryParams(t.params);
        getReportingSummary(db, null, paramsExtracted)
          .then((reportingSummary) => {
            t.assertions(reportingSummary);
            done();
          })
          .catch(done)
          .then(() => {
            db.destroy();
          });
      });
    });
  };
  test({
    description: "get valid reporting window",
    params: {
      feeWindow: "0x1000000000000000000000000000000000000000",
    },
    assertions: (reportingSummary) => {
      assert.deepEqual(reportingSummary, {
        "AWAITING_FINALIZATION": 1,
        "DESIGNATED_REPORTING": 9,
        "CROWDSOURCING_DISPUTE": 2,
        "FINALIZED": 1,
        "PRE_REPORTING": 1,
      });
    },
  });
  test({
    description: "non-existent reporting window",
    params: {
      feeWindow: "0xfffffffffffff000000000000000000000000000",
    },
    assertions: (reportingSummary) => {
      assert.deepEqual(reportingSummary, {});
    },
  });
});
