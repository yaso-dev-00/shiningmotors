# AI Assistant Endpoint Test Script
# Run this in PowerShell to test AI endpoints

$baseUrl = "http://localhost:3000"
Write-Host "Testing AI Assistant Endpoints..." -ForegroundColor Cyan
Write-Host "=" * 50

# Test 1: Chat API - Missing Message
Write-Host "`n[Test 1] Chat API - Missing Message" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/chat" -Method POST -ContentType "application/json" -Body '{}' -ErrorAction Stop
    Write-Host "❌ FAILED: Should return 400" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ PASSED: Returns 400 as expected" -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED: Unexpected error" -ForegroundColor Red
    }
}

# Test 2: Chat API - Empty Message
Write-Host "`n[Test 2] Chat API - Empty Message" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/chat" -Method POST -ContentType "application/json" -Body '{"message":""}' -ErrorAction Stop
    Write-Host "❌ FAILED: Should return 400" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ PASSED: Returns 400 as expected" -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED: Unexpected error" -ForegroundColor Red
    }
}

# Test 3: Chat API - Rule-Based Response (Hi)
Write-Host "`n[Test 3] Chat API - Rule-Based Response (Hi)" -ForegroundColor Yellow
try {
    $startTime = Get-Date
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/chat" -Method POST -ContentType "application/json" -Body '{"message":"Hi"}' -ErrorAction Stop
    $duration = ((Get-Date) - $startTime).TotalMilliseconds
    
    if ($response.source -eq "rule") {
        Write-Host "✅ PASSED: Rule-based response" -ForegroundColor Green
        Write-Host "   Source: $($response.source)" -ForegroundColor Gray
        Write-Host "   Response time: $([math]::Round($duration))ms" -ForegroundColor Gray
        Write-Host "   Response: $($response.response.Substring(0, [Math]::Min(50, $response.response.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "⚠️  WARNING: Expected rule-based, got $($response.source)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Chat API - Rule-Based Response (Return Policy)
Write-Host "`n[Test 4] Chat API - Rule-Based Response (Return Policy)" -ForegroundColor Yellow
try {
    $startTime = Get-Date
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/chat" -Method POST -ContentType "application/json" -Body '{"message":"What is your return policy?"}' -ErrorAction Stop
    $duration = ((Get-Date) - $startTime).TotalMilliseconds
    
    if ($response.source -eq "rule") {
        Write-Host "✅ PASSED: Rule-based response" -ForegroundColor Green
        Write-Host "   Source: $($response.source)" -ForegroundColor Gray
        Write-Host "   Response time: $([math]::Round($duration))ms" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  WARNING: Expected rule-based, got $($response.source)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Chat API - Cache Test
Write-Host "`n[Test 5] Chat API - Cache Test" -ForegroundColor Yellow
$uniqueMessage = "Cache test $(Get-Date -Format 'yyyyMMddHHmmss')"
try {
    # First request
    Write-Host "   First request (should call API)..." -ForegroundColor Gray
    $start1 = Get-Date
    $response1 = Invoke-RestMethod -Uri "$baseUrl/api/ai/chat" -Method POST -ContentType "application/json" -Body "{`"message`":`"$uniqueMessage`"}" -ErrorAction Stop
    $duration1 = ((Get-Date) - $start1).TotalMilliseconds
    
    # Second request
    Write-Host "   Second request (should use cache)..." -ForegroundColor Gray
    Start-Sleep -Seconds 1
    $start2 = Get-Date
    $response2 = Invoke-RestMethod -Uri "$baseUrl/api/ai/chat" -Method POST -ContentType "application/json" -Body "{`"message`":`"$uniqueMessage`"}" -ErrorAction Stop
    $duration2 = ((Get-Date) - $start2).TotalMilliseconds
    
    if ($response2.cached -eq $true -or $response2.source -eq "cache") {
        Write-Host "✅ PASSED: Cache working" -ForegroundColor Green
        Write-Host "   First: $([math]::Round($duration1))ms, Second: $([math]::Round($duration2))ms" -ForegroundColor Gray
        $improvement = [math]::Round((($duration1 - $duration2) / $duration1) * 100, 1)
        Write-Host "   Speed improvement: $improvement%" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  WARNING: Cache may not be working" -ForegroundColor Yellow
        Write-Host "   First source: $($response1.source), Second source: $($response2.source)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Chat API - API Call (if no rule/cache match)
Write-Host "`n[Test 6] Chat API - API Call Test" -ForegroundColor Yellow
$apiTestMessage = "Tell me about electric vehicles in 2024 $(Get-Date -Format 'HHmmss')"
try {
    $startTime = Get-Date
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/chat" -Method POST -ContentType "application/json" -Body "{`"message`":`"$apiTestMessage`"}" -ErrorAction Stop
    $duration = ((Get-Date) - $startTime).TotalMilliseconds
    
    if ($response.response) {
        Write-Host "✅ PASSED: API call successful" -ForegroundColor Green
        Write-Host "   Source: $($response.source)" -ForegroundColor Gray
        Write-Host "   Response time: $([math]::Round($duration))ms" -ForegroundColor Gray
        if ($response.model) {
            Write-Host "   Model: $($response.model)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ FAILED: No response received" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  WARNING: API call failed (may be expected if no API key)" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Test 7: Track API - Without Auth
Write-Host "`n[Test 7] Track API - Without Auth" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/track" -Method POST -ContentType "application/json" -Body '{"interaction_type":"view","item_type":"product"}' -ErrorAction Stop
    Write-Host "❌ FAILED: Should return 401" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ PASSED: Returns 401 as expected" -ForegroundColor Green
    } else {
        Write-Host "⚠️  WARNING: Expected 401, got $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host "`n✅ Basic endpoint tests completed!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:3000 in browser" -ForegroundColor White
Write-Host "2. Look for red chat button in bottom-right" -ForegroundColor White
Write-Host "3. Click to open chat and test UI" -ForegroundColor White
Write-Host "4. Use AI_ASSISTANT_QUICK_TEST_CHECKLIST.md for full testing" -ForegroundColor White

