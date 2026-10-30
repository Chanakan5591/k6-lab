import http from 'k6/http';
import { check, sleep } from 'k6';

// Match the exact names returned by the toppings and tools endpoints.
export default function () {
  const res = http.post('https://quickpizza.grafana.com/api/pizza',
    JSON.stringify({
      excludedIngredients: ['Pepperoni'],
      excludedTools: ['Knife'],
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
