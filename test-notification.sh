#!/bin/bash

API_BASE="http://localhost:3001/api"

echo "=== 1. 登录获取 admin token ==="
ADMIN_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}')
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
ADMIN_ID=$(echo "$ADMIN_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['_id'])")
echo "admin token 获取成功"

echo ""
echo "=== 2. 获取 handler1 token ==="
HANDLER_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"handler1","password":"123456"}')
HANDLER_TOKEN=$(echo "$HANDLER_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "handler1 token 获取成功"

echo ""
echo "=== 3. 获取一个处理中的工单 ==="
WORKORDERS=$(curl -s "$API_BASE/workorders?status=processing&pageSize=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
WO_ID=$(echo "$WORKORDERS" | python3 -c "import sys,json; print(json.load(sys.stdin)['list'][0]['_id'])")
WO_TITLE=$(echo "$WORKORDERS" | python3 -c "import sys,json; print(json.load(sys.stdin)['list'][0]['title'])")
echo "工单ID: $WO_ID"
echo "工单标题: $WO_TITLE"

echo ""
echo "=== 4. 催办前 - handler1 的通知统计 ==="
STATS_BEFORE=$(curl -s "$API_BASE/notifications/stats" \
  -H "Authorization: Bearer $HANDLER_TOKEN")
echo "$STATS_BEFORE" | python3 -c "
import sys,json
s = json.load(sys.stdin)
print(f'未读总数: {s[\"unread\"]}')
print(f'催办通知: {s[\"byType\"][\"reminder\"]}')
"

echo ""
echo "=== 5. 执行催办 ==="
REMIND_RESULT=$(curl -s -X PUT "$API_BASE/workorders/$WO_ID/remind" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"operatorId\":\"$ADMIN_ID\",\"operatorName\":\"系统管理员\",\"message\":\"请尽快处理此工单\"}")
echo "催办完成"

echo ""
echo "=== 6. 催办后 - handler1 的通知统计 ==="
STATS_AFTER=$(curl -s "$API_BASE/notifications/stats" \
  -H "Authorization: Bearer $HANDLER_TOKEN")
echo "$STATS_AFTER" | python3 -c "
import sys,json
s = json.load(sys.stdin)
print(f'未读总数: {s[\"unread\"]}')
print(f'催办通知: {s[\"byType\"][\"reminder\"]}')
"

echo ""
echo "=== 7. 最新催办通知详情 ==="
LATEST=$(curl -s "$API_BASE/notifications?pageSize=1&type=reminder" \
  -H "Authorization: Bearer $HANDLER_TOKEN")
echo "$LATEST" | python3 -c "
import sys,json
data = json.load(sys.stdin)
if data['list']:
    n = data['list'][0]
    print(f'标题: {n[\"title\"]}')
    print(f'内容: {n[\"content\"]}')
    print(f'类型: {n[\"type\"]}')
    print(f'相关类型: {n[\"relatedType\"]}')
    print(f'相关ID: {n[\"relatedId\"]}')
    print(f'发送人: {n[\"senderName\"]}')
    print(f'状态: {n[\"status\"]}')
else:
    print('没有催办通知')
"
