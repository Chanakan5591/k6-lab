import http from 'k6/http';

export default function () {
  const params = { headers: { Authorization: 'token abcdef0123456789' } };
  const toppings = http.get('https://quickpizza.grafana.com/api/ingredients/topping', params);
  console.log('TOPPINGS status=' + toppings.status + ' ' + toppings.body);
  const tools = http.get('https://quickpizza.grafana.com/api/tools', params);
  console.log('TOOLS status=' + tools.status + ' ' + tools.body);
}
