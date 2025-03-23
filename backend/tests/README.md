# Testing in Backend

This directory contains tests for the backend application. The tests are written using Jest.

## Running Tests

To run the tests, use one of the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode (automatically re-run tests when files change)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

The tests are organized by feature area:

- `repositories/`: Tests for repository functions that interact with DynamoDB
- (Add more directories as they are created)

## Writing Tests

When writing tests:

1. Create a new test file with the `.test.ts` extension
2. Mock external dependencies (especially AWS services)
3. Follow the pattern of existing tests (setup, execute, verify)
4. Use descriptive test names that explain what is being tested
5. Keep tests focused and small

## Mocking Strategy

For DynamoDB and other AWS services:

- Use Jest's mocking functionality to mock AWS SDK clients
- Mock the DynamoDB Toolbox entities at the model level
- Use beforeEach to reset mocks between tests

Example:

```typescript
// Mock the dependencies before importing modules
jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
}));

// Then import and test your code
import { yourFunction } from "../../src/your-module";

describe("Your test suite", () => {
  it("should do something", async () => {
    // Test implementation
  });
});
```
