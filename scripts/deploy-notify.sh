#!/bin/bash

# ============================================
# MDLooker 部署通知脚本
# 用于发送部署状态通知到多个渠道
# ============================================

set -e

# 配置变量（从环境变量读取）
DEPLOYMENT_STATUS="${DEPLOYMENT_STATUS:-success}"
DEPLOYMENT_URL="${DEPLOYMENT_URL:-https://ppe-platform.vercel.app}"
GITHUB_RUN_ID="${GITHUB_RUN_ID:-unknown}"
GITHUB_SHA="${GITHUB_SHA:-unknown}"
GITHUB_ACTOR="${GITHUB_ACTOR:-unknown}"
GITHUB_REF="${GITHUB_REF:-unknown}"

# Slack Webhook URL（可选）
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# 钉钉 Webhook（可选）
DINGTALK_WEBHOOK_URL="${DINGTALK_WEBHOOK_URL:-}"

# 企业微信 Webhook（可选）
WECHAT_WORK_WEBHOOK_URL="${WECHAT_WORK_WEBHOOK_URL:-}"

# 颜色配置
SUCCESS_COLOR="good"
FAILURE_COLOR="danger"
INFO_COLOR="#36a64f"

# ============================================
# 函数：发送 Slack 通知
# ============================================
send_slack_notification() {
    if [ -z "$SLACK_WEBHOOK_URL" ]; then
        echo "⚠️ Slack Webhook 未配置，跳过通知"
        return 0
    fi

    local color="$SUCCESS_COLOR"
    local emoji="✅"
    local title="部署成功"
    
    if [ "$DEPLOYMENT_STATUS" != "success" ]; then
        color="$FAILURE_COLOR"
        emoji="🚨"
        title="部署失败"
    fi

    local payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "author_name": "MDLooker CI/CD",
            "title": "$emoji $title",
            "text": "项目：ppe-platform\n分支：$GITHUB_REF\n提交：${GITHUB_SHA:0:7}\n操作人：$GITHUB_ACTOR",
            "fields": [
                {
                    "title": "状态",
                    "value": "$DEPLOYMENT_STATUS",
                    "short": true
                },
                {
                    "title": "环境",
                    "value": "Production",
                    "short": true
                }
            ],
            "actions": [
                {
                    "type": "button",
                    "text": "查看部署",
                    "url": "https://github.com/maxiaoha/mdlooker/actions/runs/$GITHUB_RUN_ID"
                },
                {
                    "type": "button",
                    "text": "访问站点",
                    "url": "$DEPLOYMENT_URL"
                }
            ],
            "footer": "MDLooker Deployment",
            "ts": $(date +%s)
        }
    ]
}
EOF
)

    curl -X POST -H 'Content-type: application/json' --data "$payload" "$SLACK_WEBHOOK_URL"
    echo "✅ Slack 通知已发送"
}

# ============================================
# 函数：发送钉钉通知
# ============================================
send_dingtalk_notification() {
    if [ -z "$DINGTALK_WEBHOOK_URL" ]; then
        echo "⚠️ 钉钉 Webhook 未配置，跳过通知"
        return 0
    fi

    local title="✅ 部署成功"
    local color="#36a64f"
    
    if [ "$DEPLOYMENT_STATUS" != "success" ]; then
        title="🚨 部署失败"
        color="#FF0000"
    fi

    local payload=$(cat <<EOF
{
    "msgtype": "markdown",
    "markdown": {
        "title": "$title",
        "text": "## $title\n\n**项目**: ppe-platform\n**分支**: $GITHUB_REF\n**提交**: ${GITHUB_SHA:0:7}\n**操作人**: $GITHUB_ACTOR\n**状态**: $DEPLOYMENT_STATUS\n**环境**: Production\n\n[查看部署详情](https://github.com/maxiaoha/mdlooker/actions/runs/$GITHUB_RUN_ID)\n\n[访问生产环境]($DEPLOYMENT_URL)"
    },
    "at": {
        "isAtAll": true
    }
}
EOF
)

    curl -X POST -H 'Content-Type: application/json' --data "$payload" "$DINGTALK_WEBHOOK_URL"
    echo "✅ 钉钉通知已发送"
}

# ============================================
# 函数：发送企业微信通知
# ============================================
send_wechat_work_notification() {
    if [ -z "$WECHAT_WORK_WEBHOOK_URL" ]; then
        echo "⚠️ 企业微信 Webhook 未配置，跳过通知"
        return 0
    fi

    local title="✅ 部署成功"
    
    if [ "$DEPLOYMENT_STATUS" != "success" ]; then
        title="🚨 部署失败"
    fi

    local payload=$(cat <<EOF
{
    "msgtype": "markdown",
    "markdown": {
        "content": "## $title\n\n**项目**: ppe-platform\n**分支**: $GITHUB_REF\n**提交**: ${GITHUB_SHA:0:7}\n**操作人**: $GITHUB_ACTOR\n**状态**: $DEPLOYMENT_STATUS\n**环境**: Production\n\n[查看部署详情](https://github.com/maxiaoha/mdlooker/actions/runs/$GITHUB_RUN_ID)\n[访问生产环境]($DEPLOYMENT_URL)"
    }
}
EOF
)

    curl -X POST -H 'Content-Type: application/json' --data "$payload" "$WECHAT_WORK_WEBHOOK_URL"
    echo "✅ 企业微信通知已发送"
}

# ============================================
# 主函数
# ============================================
main() {
    echo "🚀 开始发送部署通知..."
    echo "状态：$DEPLOYMENT_STATUS"
    echo "URL: $DEPLOYMENT_URL"
    
    # 发送通知到所有配置的渠道
    send_slack_notification
    send_dingtalk_notification
    send_wechat_work_notification
    
    echo "✅ 所有通知已发送完成"
}

# 执行主函数
main
