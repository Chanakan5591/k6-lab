import http from 'k6/http';
import { check, sleep } from 'k6';

const P95 = __ENV.P95 || 1500;
const PARAMS = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'token abcdef0123456789',
  },
};

export const options = {
  vus: 3,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: [`p(95)<${P95}`],
    checks: ['rate>0.99'],
  },
};

export default function () {
  const res = http.post('https://quickpizza.grafana.com/api/pizza',
    JSON.stringify({ mustBeVegetarian: true }), PARAMS);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'pizza has a name': (r) => r.json('pizza.name') !== undefined,
  });
  sleep(1);
}
