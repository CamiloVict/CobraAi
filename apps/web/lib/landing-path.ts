export type LandingPath = "/portfolios" | "/dashboard";

export function landingPathForPortfolioCount(count: number): LandingPath {
  return count === 0 ? "/portfolios" : "/dashboard";
}
