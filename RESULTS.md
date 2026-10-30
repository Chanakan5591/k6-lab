# K6 lab results

Tests run on 30 October 2026 with k6 v2.3.0 on macOS arm64, against
`https://quickpizza.grafana.com/`. Times are in milliseconds unless stated otherwise.

## Part 0

### Step 0.1: first test

The single request took **263.26 ms**. The status check passed and the exit code
was **0**. All the displayed percentiles were the same because there was only
one request.

### Step 0.2: five users for twenty seconds

The run made **80 requests** at **3.821383 requests/s**, with **p(95) 371.58 ms**.
All 80 checks passed and no HTTP requests failed.

Each VU waits for its response, then sleeps for one second. With an average
response time of 268.81 ms, the approximate rate is
`5 / (1 + 0.26881) = 3.94 requests/s`. Connection setup, overhead and the start
and end of the run also affect the measured rate. Five users therefore do not
mean five requests every second.

### Step 0.3: fixed iterations

There were exactly **20 iterations and 20 requests**, shared among the five VUs.
All 20 checks passed. Setting a duration controls how long the test runs;
setting iterations controls how much work it completes.

### Step 0.4: pizza API

All **3/3 checks** passed: the status was 200, the pizza had a name, and every
ingredient was vegetarian. The exit code was **0**. Checking the ingredients
matters because a 200 response could still contain the wrong recommendation.

### Step 0.5: no token

The API returned **401**, as expected. The rejection check passed and
`http_req_failed` was **0%** because `http.expectedStatuses(401)` marked this
response as expected for this test. The exit code was **0**.

### Step 0.6: thresholds

| Run | p(95) | HTTP failures | Checks passed | Thresholds | Exit code |
| --- | --- | --- | --- | --- | --- |
| Default P95=1500 | 380.97 ms | 0% | 100% | All passed | 0 |
| P95=300 | 374.25 ms | 0% | 100% | p(95)<300 failed | 99 |

The second run was slightly faster, but its response time still exceeded the
stricter limit. The other two thresholds passed. This shows the difference
between checks and thresholds: a failed check is counted, while a failed
threshold makes k6 return a failing exit code.

### Step 0.7: requirement

The test used **3 VUs for 30 seconds**, with these thresholds:

```js
thresholds: {
  http_req_duration: ['p(95)<1000', 'p(99)<1500'],
  http_req_failed: ['rate<0.01'],
}
```

| Run | p(95) | p(99) | HTTP failures | Thresholds | Exit code |
| --- | --- | --- | --- | --- | --- |
| Original requirement | 366.83 ms | 371.03 ms | 0% | All three passed | 0 |
| P95 changed to 1 ms | 371.25 ms | 376.94 ms | 0% | p(95)<1 failed; the other two passed | 99 |

The original run sent 69 requests and passed all 138 checks. For the second
run, `-e P95=1` changed only the p(95) limit. All 136 checks still passed, but
the response-time threshold failed.

### Step 0.8: bug hunt

The request excluded lowercase `pepperoni` and `knife`, but the API listed
these names as **`Pepperoni`** and **`Knife`**. Changing the request to match
those names fixed the failed checks. The checks themselves stayed the same.

| Check | Before | After |
| --- | --- | --- |
| Status 200 | 75 / 75 passed | 75 / 75 passed |
| No pepperoni | 69 / 75 passed | 75 / 75 passed |
| No knife needed | 53 / 75 passed | 75 / 75 passed |
| Total | 197 / 225 passed | 225 / 225 passed |

Both runs had **0% HTTP failures** and exit code **0**. The original script had
no thresholds, so the failed checks did not fail the whole run. There were 28
failed checks, but that does not necessarily mean 28 different pizzas: one
response could fail both restriction checks.

A single manual request might happen to avoid pepperoni and a knife even with
the wrong exclusions. Repeating the request made those mistakes easier to find.
The problem was the request values; the results do not show that concurrency
caused the bug.

## Part A results

| Step | Test type | Users | Req/s | p(95) | Max | Failed | Checks |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Smoke | 1 | 0.578181 | 387.77 ms | 401.51 ms | 0% | 100% |
| A2 | Average load | 3 | 1.300001 | 370.73 ms | 467.29 ms | 0% | 100% |
| A3 | Stress | 5 | 2.122311 | 373.04 ms | 456.60 ms | 0% | 100% |
| A4 | Spike | 5 | 1.050024 | 385.56 ms | 456.85 ms | 0% | 100% |
| A5 | Soak | 2 | 0.968187 | 375.52 ms | 496.47 ms | 0% | 100% |

All five tests passed their thresholds. The request counts were **18, 234, 382,
147 and 639** respectively. Req/s is the rate for the whole run, including the
ramps. The p(95) and max columns use overall `http_req_duration`.

### Spike

These are approximate times from the start of the test. Each p(95) was calculated
from the requests in that window.

| Window | Phase | Requests | p(95) | HTTP failures |
| --- | --- | --- | --- | --- |
| 0-30 s | Before spike | 16 | 367.51 ms | 0 / 16 |
| 35-65 s | Five-VU plateau | 76 | 381.73 ms | 0 / 76 |
| 70-100 s | Just after target dropped | 15 | 443.62 ms | 0 / 15 |
| 100-130 s | Later at one VU | 16 | 373.55 ms | 0 / 16 |

### Soak

The soak schedule was 30 seconds up, 10 minutes at two VUs and 30 seconds down,
so eleven minutes in total. These two-minute windows exclude the ramps.

| Window | Requests | p(95) | HTTP failures |
| --- | --- | --- | --- |
| 30-150 s | 123 | 398.35 ms | 0 / 123 |
| 150-270 s | 121 | 372.78 ms | 0 / 121 |
| 270-390 s | 121 | 380.46 ms | 0 / 121 |
| 390-510 s | 124 | 365.40 ms | 0 / 124 |
| 510-630 s | 118 | 357.33 ms | 0 / 118 |

Reports: [average](reports/a2-average.html), [stress](reports/a3-stress.html),
[spike](reports/a4-spike.html) and [soak](reports/a5-soak.html).

## Part B

1. **Results table**

   The table above contains the results for A1-A5. All had 0% failed HTTP
   requests and 100% passed checks.

2. **Why was the rate below five requests per second?**

   In Step 0.2 the rate was **3.821383 requests/s**. Each user waits for the
   response and then sleeps for one second, so an iteration takes longer than
   a second. Five VUs cannot produce five requests per second with that delay.

3. **Did response time grow from average load to stress?**

   Overall p(95) rose from **370.73 ms** at three VUs to **373.04 ms** at five,
   an increase of **2.31 ms, or 0.62%**. Throughput rose from **1.300001** to
   **2.122311 requests/s**, with no failures. That is very little change in
   response time and is consistent with both loads being within the system's
   operational envelope. These small tests did not find its capacity limit.

   The individual endpoint results also varied: home-page p(95) fell from
   **341.52 to 333.59 ms**, and recommendation p(95) fell from **401.82 to
   380.07 ms**. Other users' traffic and internet conditions could explain some
   of the variation between runs.

4. **How long did recovery take after the spike?**

   The target returned to one VU at about **70 seconds**. The first ten-second
   window below the pre-spike p(95) was **80-90 seconds**, at **337.97 ms**.
   That suggests an initial return about **10-20 seconds after the drop**.
   However, p(95) rose again to **415.53 ms at 90-100 seconds**, so this was
   not a clear, stable recovery point. Each of those windows had only 4-6
   requests, and in-progress journeys could finish during ramp down.

   By the **100-130 second** window, p(95) was **373.55 ms**, close to the
   **367.51 ms** before the spike. The data suggests a return towards the
   earlier level, but it is too sparse and variable to give an exact recovery
   time.

5. **Did the soak get worse, and what could a longer test reveal?**

   There was no sustained worsening. Early p(95) was **398.35 ms**, compared
   with **357.33 ms** in the final steady-load window, about **10.30% lower**.
   There were no HTTP failures in either window or across all **639 requests**,
   and all **852 checks passed**.

   A test lasting several hours could reveal a memory leak. Memory that is
   not released can build up until the application slows down or runs out of
   memory. An eleven-minute test cannot rule that out.

6. **Why use p(95) instead of the average?**

   An average can hide a small number of slow responses. p(95) shows the time
   that 95% of requests finish within, which matches the requirement more
   directly. The slowest 5% still matter, so p(99), max and failures are useful
   too.

7. **Why could the numbers differ in a lab?**

   First, a controlled network can have lower and more stable latency than an
   internet connection. Second, other people use the shared QuickPizza site,
   changing its load and cache state. A lab can control that background traffic.
   Different hardware or test data could also change the results.

8. **Why not run hundreds of users against a site without permission?**

   That traffic could use up resources, interrupt other users and cause an
   outage. It could also violate the site's terms. Large stress, spike and
   breakpoint tests need the owner's permission. These runs stayed within the
   lab's five-VU limit, with two VUs for the soak test.

9. **A performance requirement for Instagram**

   Vague: "The Instagram feed should load quickly."

   Testable: "In an authorized test environment, with 100 concurrent users
   requesting the initial feed page for 10 minutes using a fixed test dataset,
   95% of feed API requests must finish in under one second, 99% in under
   1.5 seconds, and fewer than 1% may fail. Each user waits two seconds between
   requests."

   ```js
   export const options = {
     vus: 100,
     duration: '10m',
     thresholds: {
       'http_req_duration{name:feed}': ['p(95)<1000', 'p(99)<1500'],
       'http_req_failed{name:feed}': ['rate<0.01'],
     },
   };
   ```

   The feed request would need the tag `{ name: 'feed' }` and the iteration
   would need `sleep(2)`. This is a proposed requirement for the API, not a
   measurement of the whole screen loading or a published Instagram guarantee.
   This example was not run against Instagram or QuickPizza.
