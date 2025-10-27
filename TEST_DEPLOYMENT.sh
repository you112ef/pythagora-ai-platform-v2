#!/bin/bash

# Deployment Testing Script
# Tests all critical endpoints

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║         🧪 Pythagora AI Platform - Deployment Test              ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Get base URL from argument or use default
BASE_URL="${1:-http://localhost:3000}"

echo "📍 Testing URL: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    
    echo -n "Testing: $name ... "
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" -eq "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_code, got $http_code)"
        ((FAILED++))
    fi
}

echo "═══════════════════════════════════════════════════════════════════"
echo "📊 Running Tests..."
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Test 1: Health Check
test_endpoint "Health Check" "$BASE_URL/api/health" 200

# Test 2: Homepage
test_endpoint "Homepage" "$BASE_URL/" 200

# Test 3: AI Providers Page
test_endpoint "AI Providers Page" "$BASE_URL/ai-providers.html" 200

# Test 4: Static CSS
test_endpoint "Static CSS File" "$BASE_URL/css/main.css" 200

# Test 5: 404 Handler
test_endpoint "404 Error Handler" "$BASE_URL/nonexistent-route" 404

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "📊 Test Results"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

echo "📈 Success Rate: $SUCCESS_RATE%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment is successful!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please check the server.${NC}"
    exit 1
fi
