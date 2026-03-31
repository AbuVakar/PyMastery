import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
    errors: ['rate<0.01'],           // Custom error rate under 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.pymastery.com';

export default function () {
  // Test health endpoint
  let healthResponse = http.get(`${BASE_URL}/api/health`);
  let healthOk = check(healthResponse, {
    'health endpoint status is 200': (r) => r.status === 200,
    'health response time < 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(!healthOk);

  // Test authentication endpoints
  let loginResponse = http.post(`${BASE_URL}/api/auth/login`, 
    JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword'
    }), 
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  let loginOk = check(loginResponse, {
    'login endpoint status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(!loginOk);

  // Test course endpoints
  let coursesResponse = http.get(`${BASE_URL}/api/v1/courses`);
  let coursesOk = check(coursesResponse, {
    'courses endpoint status is 200': (r) => r.status === 200,
    'courses response time < 300ms': (r) => r.timings.duration < 300,
  });
  errorRate.add(!coursesOk);

  // Test problem endpoints
  let problemsResponse = http.get(`${BASE_URL}/api/v1/problems`);
  let problemsOk = check(problemsResponse, {
    'problems endpoint status is 200': (r) => r.status === 200,
    'problems response time < 400ms': (r) => r.timings.duration < 400,
  });
  errorRate.add(!problemsOk);

  // Test code execution endpoint (if available)
  let codeExecutionResponse = http.post(`${BASE_URL}/api/v1/code/execute`, 
    JSON.stringify({
      source_code: 'print("Hello, World!")',
      language: 'python',
      stdin: ''
    }), 
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  let codeExecutionOk = check(codeExecutionResponse, {
    'code execution endpoint status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'code execution response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  errorRate.add(!codeExecutionOk);

  // Test frontend
  let frontendResponse = http.get(`${BASE_URL.replace('/api', '')}/`);
  let frontendOk = check(frontendResponse, {
    'frontend status is 200': (r) => r.status === 200,
    'frontend response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  errorRate.add(!frontendOk);

  sleep(1);
}

export function handleSummary(data) {
  console.log('Performance Test Summary:');
  console.log(`Total requests: ${data.metrics.http_reqs.count}`);
  console.log(`Failed requests: ${data.metrics.http_req_failed.count}`);
  console.log(`Request rate: ${data.metrics.http_reqs.rate}`);
  console.log(`Average response time: ${data.metrics.http_req_duration.avg}ms`);
  console.log(`95th percentile: ${data.metrics.http_req_duration['p(95)']}ms`);
  console.log(`Error rate: ${(data.metrics.http_req_failed.rate * 100).toFixed(2)}%`);
}
