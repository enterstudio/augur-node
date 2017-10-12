import * as _ from "lodash";
import * as Knex from "knex";
import { Address, JoinedReportsMarketsRow, UIReport } from "../../types";

interface UIReports {
  [universe: string]: {
    [marketID: string]: Array<UIReport>
  };
}

// Look up a user's reporting history (i.e., all reports submitted by a given reporter); should take reporter (address) as a required parameter and take market, universe, and reportingWindow all as optional parameters. For reporting windows that are complete, should also include the consensus outcome, whether the user's report matched the consensus, how much REP the user gained or lost from redistribution, and how much the user earned in reporting fees.
export function getReportingHistory(db: Knex, reporter: Address, marketID: Address|null|undefined, universe: Address|null|undefined, reportingWindow: Address|null|undefined, callback: (err?: Error|null, result?: any) => void): void {
  // { universe: { marketID: { marketID, reportingWindow, payoutNumerators, isCategorical, isScalar, isIndeterminate } } }
  const queryData: any = { reporter };
  if (marketID != null) queryData["reports.market_id"] = marketID;
  if (universe != null) queryData.universe = universe;
  if (reportingWindow != null) queryData.reporting_window = reportingWindow;
  const rowsToSelect: Array<string> = [
    "reports.market_id",
    "markets.universe",
    "markets.reporting_window",
    "reports.reporting_token",
    "reports.amount_staked",
    "reports.is_invalid",
    "reports.payout0",
    "reports.payout1",
    "reports.payout2",
    "reports.payout3",
    "reports.payout4",
    "reports.payout5",
    "reports.payout6",
    "reports.payout7"
  ];
  db.select(rowsToSelect).from("reports").join("markets", "markets.market_id", "reports.market_id").where(queryData).orderBy("report_id").asCallback((err?: Error|null, joinedReportsMarketsRows?: Array<JoinedReportsMarketsRow>): void => {
    if (err) return callback(err);
    if (!joinedReportsMarketsRows || !joinedReportsMarketsRows.length) return callback(null);
    const reports: UIReports = {};
    joinedReportsMarketsRows.forEach((row: JoinedReportsMarketsRow): void => {
      if (!reports[row.universe]) reports[row.universe] = {};
      if (!reports[row.universe][row.market_id]) reports[row.universe][row.market_id] = [];
      const payoutNumerators: Array<string|number|null> = [row.payout0, row.payout1, row.payout2, row.payout3, row.payout4, row.payout5, row.payout6, row.payout7].filter((payout: string|number|null): boolean => payout != null);
      const report: UIReport = {
        marketID: row.market_id,
        reportingWindow: row.reporting_window,
        payoutNumerators,
        amountStaked: row.amount_staked,
        reportingToken: row.reporting_token,
        isCategorical: row.market_type === "categorical",
        isScalar: row.market_type === "scalar",
        isIndeterminate: Boolean(row.is_invalid),
        isSubmitted: true
      };
      reports[row.universe][row.market_id].push(report);
    });
    callback(null, reports);
  });
}