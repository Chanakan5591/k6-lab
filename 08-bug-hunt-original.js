import http from 'k6/http';
import { check, sleep } from 'k6';

// Original request from Step 0.8, before fixing the exclusion names.
export default function () {
  const res = http.post('https://quickpizza.grafana.com/api/pizza',
    JSON.stringify({
      excludedIngredients: ['pepperoni'],
      excludedTools: ['knife'],
    }), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'token abcdef0123456789',
      },
    });
  check(res, {
    'status is 200': (r) => r.status === 200,
    'no pepperoni': (r) =>
      !r.json('pizza.ingredients').some((i) => i.name === 'Pepperoni'),
    'no knife needed': (r) => r.json('pizza.tool') !== 'Knife',
  });
  sleep(1);
}
