module.exports = {
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:5002',
  EVENTS_SERVICE_URL: process.env.EVENTS_SERVICE_URL || 'http://localhost:5003',
  OPPORTUNITIES_SERVICE_URL: process.env.OPPORTUNITIES_SERVICE_URL || 'http://localhost:5004',
  CERTIFICATION_SERVICE_URL: process.env.CERTIFICATION_SERVICE_URL || 'http://localhost:5005',
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5009',
  DOCUMENT_VAULT_SERVICE_URL: process.env.DOCUMENT_VAULT_SERVICE_URL || 'http://localhost:5006',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:5007',
  MOCK_TEST_SERVICE_URL: process.env.MOCK_TEST_SERVICE_URL || 'http://localhost:5008',
};
