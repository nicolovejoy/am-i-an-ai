#!/bin/bash

# Set colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running Authentication System Tests...${NC}"

# Create an array of test files
TEST_FILES=(
  "src/components/LoginForm.test.tsx"
  "src/components/RegisterForm.test.tsx"
  "src/components/ProtectedRoute.test.tsx"
  "src/store/useAuthStore.test.ts"
  "src/providers/AuthProvider.test.tsx"
  "src/app/login/page.test.tsx"
  "src/app/register/page.test.tsx"
  "src/app/account/page.test.tsx"
)

# Variables to track test results
PASSED=0
FAILED=0
TOTAL=${#TEST_FILES[@]}

# Run each test
for test_file in "${TEST_FILES[@]}"; do
  if [ -f "$test_file" ]; then
    echo -e "${YELLOW}Running test: ${test_file}${NC}"
    if npx jest "$test_file"; then
      echo -e "${GREEN}✓ Test passed: ${test_file}${NC}\n"
      ((PASSED++))
    else
      echo -e "${RED}✗ Test failed: ${test_file}${NC}\n"
      ((FAILED++))
    fi
  else
    echo -e "${RED}✗ Test file not found: ${test_file}${NC}\n"
    ((FAILED++))
  fi
done

# Display summary
echo -e "${YELLOW}Authentication Test Summary:${NC}"
echo -e "${GREEN}Passed: ${PASSED}/${TOTAL}${NC}"
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed: ${FAILED}/${TOTAL}${NC}"
fi

# Return exit code based on test results
if [ $FAILED -gt 0 ]; then
  exit 1
else
  echo -e "${GREEN}All authentication tests passed!${NC}"
  exit 0
fi 