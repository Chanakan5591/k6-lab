# k6 lab

Performance testing exercises for ITDS362, using Grafana k6 and
[QuickPizza](https://quickpizza.grafana.com/).

The lab covers HTTP requests, response checks, thresholds, and five load test
types. Measurements and answers to the reflection questions are in
[RESULTS.md](RESULTS.md).

## Setup

These tests were run on macOS with k6 v2.3.0. To install k6 with Homebrew:

```sh
brew install k6
k6 version
```

No npm packages are needed. Run the commands below from the repository folder,
one test at a time. QuickPizza is shared, so keep to the lab's limit of five VUs.
The soak test uses two VUs and runs for eleven minutes including the ramps.

## Part 0

```sh
k6 run 01-first-test.js
k6 run --vus 5 --duration 20s 01-first-test.js
k6 run --vus 5 --iterations 20 01-first-test.js
k6 run 04-pizza-api.js
k6 run 05-no-token.js
k6 run 06-thresholds.js
k6 run -e P95=300 06-thresholds.js
echo $?
k6 run 07-requirement.js
k6 run -e P95=1 07-requirement.js
echo $?
```

The two stricter threshold runs returned exit code 99. Check `echo $?`
immediately after a run to see its exit code.

For the bug hunt, `08-bug-hunt-original.js` keeps the request from the worksheet.
`08-bug-hunt.js` contains the fix after checking the names returned by the API.

```sh
k6 run --vus 5 --duration 20s 08-bug-hunt-original.js
k6 run explore.js
k6 run --vus 5 --duration 20s 08-bug-hunt.js
```

## Part A

All five tests use `journey.js`: open the home page, read quotes, then request a
vegetarian pizza, with pauses between the requests.

| Test | Peak VUs | Duration | Report |
| --- | --- | --- | --- |
| Smoke | 1 | 30 seconds | Console summary |
| Average load | 3 | 3 minutes | [a2-average.html](reports/a2-average.html) |
| Stress | 5 | 3 minutes | [a3-stress.html](reports/a3-stress.html) |
| Spike | 5 | 2 minutes 20 seconds | [a4-spike.html](reports/a4-spike.html) |
| Soak | 2 | 11 minutes | [a5-soak.html](reports/a5-soak.html) |

Start with the smoke test:

```sh
k6 run a1-smoke.js
```

To run the remaining tests and save their HTML reports:

```sh
for test in a2-average a3-stress a4-spike a5-soak; do
  K6_WEB_DASHBOARD=true \
  K6_WEB_DASHBOARD_PORT=-1 \
  K6_WEB_DASHBOARD_EXPORT="reports/$test.html" \
  k6 run "$test.js"
done
```

Download the HTML files and open them in a browser to view the graphs. GitHub's
file viewer shows the HTML source. `K6_WEB_DASHBOARD_PORT=-1` turns off the live
dashboard listener while still saving the report; omit it to use localhost:5665.

The staged tests set `gracefulStop: '0s'` inside a `ramping-vus` scenario to stop
at the scheduled end time. A journey can therefore end before its final pause
finishes. A2-A5 use the same checks and thresholds for comparison.

## References

- [k6 documentation](https://grafana.com/docs/k6/latest/)
- [HTML reports and the web dashboard](https://grafana.com/docs/k6/latest/results-output/web-dashboard/)
- [QuickPizza source](https://github.com/grafana/quickpizza)
