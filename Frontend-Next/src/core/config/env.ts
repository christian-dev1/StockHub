/**
 * Public runtime configuration. The API base is relative because the browser
 * reaches Spring Boot through this app's same-origin rewrites.
 */
export const env = {
  apiBaseUrl: '/api/v1',
  actuatorBaseUrl: '/actuator',
} as const;
