#!/bin/bash
# Continuous verification script for Phase 6/7
LOG="/tmp/continuous_phase6_7.log"
echo "=== CONTINUOUS TEST - Phase 6/7 === $(date)" >> "$LOG"
echo "DB:" >> "$LOG"; pg_isready -h localhost -p 5432 >> "$LOG" 2>&1 || echo "DB FAIL" >> "$LOG"
echo "API Health:" >> "$LOG"; curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4000/health >> "$LOG" || echo "API FAIL" >> "$LOG"
echo "Web:" >> "$LOG"; curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5173/ >> "$LOG" || echo "WEB FAIL" >> "$LOG"
echo "Directory (student):" >> "$LOG"; curl -s -o /dev/null -w '%{http_code}\n' 'http://localhost:4000/api/v1/users?role=student' >> "$LOG" || echo "DIR FAIL" >> "$LOG"
echo "Profile (username):" >> "$LOG"; curl -s -o /dev/null -w '%{http_code}\n' 'http://localhost:4000/api/v1/users/final' >> "$LOG" || echo "PROFILE FAIL" >> "$LOG"
echo "Signup:" >> "$LOG"; curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Content-Type: application/json' -d '{"email":"cont@test.com","password":"test1234","fullName":"C","requestedRole":"student"}' http://localhost:4000/api/v1/auth/signup >> "$LOG" || echo "SIGNUP FAIL" >> "$LOG"
echo "Build (tsc check):" >> "$LOG"; (cd apps/api && pnpm exec tsc -p tsconfig.json --noEmit >> /tmp/tsc_check.log 2>&1 && echo "tsc CLEAN" >> "$LOG") || echo "tsc FAIL" >> "$LOG"
echo "--- End continuous check ---" >> "$LOG"
cat "$LOG" | tail -10
