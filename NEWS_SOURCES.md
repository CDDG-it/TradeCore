# Global Markets news sources

The News view covers U.S. macro and energy publications. It is not a general
financial newswire. News requires the existing `markets` entitlement; Basic
retains calendar access. No additional API keys or SQL migrations are needed.

## Active sources

- Federal Reserve monetary policy, speeches and testimony: https://www.federalreserve.gov/feeds/feeds.htm
- BLS CPI, PPI, Employment Situation and JOLTS: https://www.bls.gov/feed/
- EIA press releases and Today in Energy: https://www.eia.gov/tools/rssfeeds/
- FRED supplies the existing calendar and latest readings using `FRED_API_KEY`.

Feed endpoints are defined in `src/lib/gmi/official-feeds.ts`. RSS and Atom are
parsed with `fast-xml-parser`. Only publisher-provided titles, excerpts and
publication timestamps are displayed. Missing/invalid publication dates are
omitted; date-only publications remain date-only. A feed's `updated` timestamp
is never substituted for its publication date.

The advertised EIA What's New feed returned HTTP 404 during verification on
2026-10-03. Its weekly petroleum RSS feed had malformed publication dates and
old content. Neither is enabled; Today in Energy provides current official
energy updates, clearly attributed to EIA.

## Caching and health

Each validated feed snapshot uses Next's persistent Data Cache with a 900-second
revalidation window. Upstream fetches are server-only and time out after ten
seconds. Revalidation errors throw, preserving the last successful snapshot.
Cache reads past 15 minutes are marked delayed, including while background
revalidation is in progress. A newly failed source without a snapshot is
unavailable. Publication age does not determine source health.

The authenticated `/api/gmi/news` response is `private, no-store`. Authentication
and rate limits run before the shared cache is accessed. Browser polling occurs
every five minutes while visible; Refresh never bypasses the source cache.
There is no background scheduler: source checks are demand-driven.

A 90-day filter does not promise 90-day archives; agencies control feed history.
No feed is labeled real-time. Per-source check timestamps and partial failures
are visible in the News view. The other providers' schedules remain unchanged.

## Reuse and attribution

Titles link to the original agency publication. Source names and publication
dates are visible with every item. No agency logos or third-party imagery are
republished. Agency reuse guidance:

- Federal Reserve: https://www.federalreserve.gov/disclaimer.htm
- BLS: https://www.bls.gov/opub/copyright-information.htm
- EIA: https://www.eia.gov/about/copyrights_reuse.php

## Evaluated alternatives, 2026-10-03

| Provider | Free-tier assessment | Decision |
| --- | --- | --- |
| GDELT | Allows commercial dataset use with attribution; broad discovery, uneven latency | Best candidate if general headlines are added later |
| Marketaux | 100 requests/day, 3 articles/request; commercial rights need clarification | Replaced in the active news route |
| NewsAPI | Free Developer tier is development/testing only, not production | Excluded |
| GNews | Free tier is noncommercial/development/testing only | Excluded |

References: https://gdeltproject.org/about.html,
https://www.marketaux.com/pricing, https://www.marketaux.com/tos,
https://newsapi.org/pricing, https://gnews.io/.

`MARKETAUX_API_KEY` is no longer used. Existing private environment files are not
modified. No alternative provider is used silently when an official feed fails.
