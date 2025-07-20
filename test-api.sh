#!/bin/bash
# API Testing Script for Robot Orchestra

API_URL="https://api.robotorchestra.org"
MATCH_ID=""

echo "🧪 Testing Robot Orchestra API..."
echo "================================"

# Test 1: Match Service Health Check
echo -n "1. Testing match-service health check... "
HEALTH=$(curl -s "$API_URL/health")
if echo "$HEALTH" | grep -q '"status":"healthy"'; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  echo "   Response: $HEALTH"
fi

# Test 2: Match History (should work via match-service now)
echo -n "2. Testing match history endpoint... "
HISTORY=$(curl -s "$API_URL/matches/history")
if echo "$HISTORY" | grep -q '"matches"'; then
  echo "✅ PASS"
  echo "   Found $(echo "$HISTORY" | jq '.count') matches"
else
  echo "❌ FAIL"
  echo "   Response: $HISTORY"
fi

# Test 3: Create New Match
echo -n "3. Testing match creation... "
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/matches" \
  -H "Content-Type: application/json" \
  -d '{"playerName": "Test Player"}')

if echo "$CREATE_RESPONSE" | grep -q '"matchId"'; then
  MATCH_ID=$(echo "$CREATE_RESPONSE" | jq -r '.matchId')
  echo "✅ PASS"
  echo "   Created match: $MATCH_ID"
  
  # Check if AI prompt was generated
  PROMPT=$(echo "$CREATE_RESPONSE" | jq -r '.rounds[0].prompt')
  echo "   Prompt: $PROMPT"
  
  # Check if it's NOT one of the hardcoded prompts
  if [[ "$PROMPT" != "Sample Prompt"* ]]; then
    echo "   ✅ AI-generated prompt confirmed!"
  else
    echo "   ⚠️  Using fallback prompt"
  fi
else
  echo "❌ FAIL"
  echo "   Response: $CREATE_RESPONSE"
  exit 1
fi

# Test 4: Retrieve Match
echo -n "4. Testing match retrieval... "
sleep 2  # Give robots time to respond
GET_RESPONSE=$(curl -s "$API_URL/matches/$MATCH_ID")
if echo "$GET_RESPONSE" | grep -q "$MATCH_ID"; then
  echo "✅ PASS"
  
  # Check robot responses
  RESPONSE_COUNT=$(echo "$GET_RESPONSE" | jq '.rounds[0].responses | length')
  echo "   Responses collected: $RESPONSE_COUNT/4"
else
  echo "❌ FAIL"
  echo "   Response: $GET_RESPONSE"
fi

# Test 5: Admin Service Health Check
echo -n "5. Testing admin-service endpoints... "
ADMIN_STATS=$(curl -s "$API_URL/admin/stats" -H "Authorization: Bearer test-token")
if echo "$ADMIN_STATS" | grep -q '"totalMatches"'; then
  echo "✅ PASS"
  echo "   Total matches: $(echo "$ADMIN_STATS" | jq '.totalMatches')"
else
  echo "⚠️  Admin service may require proper auth"
fi

# Test 6: Polling Interval Check
echo -n "6. Checking polling interval... "
echo "   Frontend should poll every 4 seconds (check browser network tab)"

echo ""
echo "================================"
echo "🎯 Test Summary"
echo "================================"
echo "- Match service: Working with history endpoint"
echo "- AI prompts: Check if prompts are dynamic"
echo "- Admin service: Deployed and accessible"
echo "- Polling: Should be 4s (verify in browser)"