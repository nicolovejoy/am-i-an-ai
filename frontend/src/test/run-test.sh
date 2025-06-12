#!/bin/bash

# Test runner script for rapid development
# Usage: ./run-test.sh [test-pattern] [options]

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
TEST_PATTERN="$1"
WATCH_MODE=""
COVERAGE=""
UPDATE_SNAPSHOTS=""

# Parse additional options
shift
while [[ $# -gt 0 ]]; do
  case $1 in
    -w|--watch)
      WATCH_MODE="--watch"
      ;;
    -c|--coverage)
      COVERAGE="--coverage"
      ;;
    -u|--update)
      UPDATE_SNAPSHOTS="--updateSnapshot"
      ;;
    *)
      echo "Unknown option: $1"
      ;;
  esac
  shift
done

# Display header
echo -e "${YELLOW}🧪 AmIAnAI Test Runner${NC}"
echo "========================"

# Run tests based on pattern
if [ -z "$TEST_PATTERN" ]; then
  echo -e "${GREEN}Running all tests...${NC}"
  npm test -- $WATCH_MODE $COVERAGE $UPDATE_SNAPSHOTS
else
  echo -e "${GREEN}Running tests matching: ${TEST_PATTERN}${NC}"
  npm test -- --testNamePattern="$TEST_PATTERN" $WATCH_MODE $COVERAGE $UPDATE_SNAPSHOTS
fi

# Show helpful commands
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  ./run-test.sh                           # Run all tests"
echo "  ./run-test.sh 'ConversationView'        # Run tests matching pattern"
echo "  ./run-test.sh 'messages' -w            # Run in watch mode"
echo "  ./run-test.sh 'bug' -c                 # Run with coverage"
echo "  ./run-test.sh 'snapshot' -u            # Update snapshots"
echo ""
echo "  npm test -- --testPathPattern=messages # Test files matching pattern"
echo "  npm test -- --bail                     # Stop after first failure"
echo "  npm test -- --verbose                  # Show individual test results"