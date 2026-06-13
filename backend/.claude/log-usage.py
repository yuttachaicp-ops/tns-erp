#!/usr/bin/env python3
"""
Claude Code Stop hook — auto-logs token usage to TNS ERP
วางไว้ที่: C:\Users\Lenovo\.claude\log-usage.py
"""
import json, sys, os
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import URLError

ERP_URL    = 'https://tns-erp.onrender.com/api/claude-usage/auto-log'
ERP_SECRET = 'tns-cron-cleanup-2026'
USER_NAME  = 'Tany_Yuttachai'

def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    transcript_path = data.get('transcript_path', '')
    session_id      = data.get('session_id', '')

    if not transcript_path or not os.path.exists(transcript_path):
        sys.exit(0)

    total_input = total_output = total_cache_read = total_cache_write = 0
    model = ''

    try:
        with open(transcript_path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                    # Both 'assistant' type entries and raw message objects
                    msg = None
                    if entry.get('type') == 'assistant':
                        msg = entry.get('message', {})
                    elif entry.get('role') == 'assistant':
                        msg = entry
                    if msg:
                        usage = msg.get('usage', {})
                        total_input       += usage.get('input_tokens', 0)
                        total_output      += usage.get('output_tokens', 0)
                        total_cache_read  += usage.get('cache_read_input_tokens', 0)
                        total_cache_write += usage.get('cache_creation_input_tokens', 0)
                        if msg.get('model'):
                            model = msg['model']
                except Exception:
                    continue
    except Exception:
        sys.exit(0)

    total = total_input + total_output + total_cache_read + total_cache_write
    if total == 0:
        sys.exit(0)

    payload = json.dumps({
        'date':             datetime.now().strftime('%Y-%m-%d'),
        'user':             USER_NAME,
        'inputTokens':      total_input,
        'outputTokens':     total_output,
        'cacheReadTokens':  total_cache_read,
        'cacheWriteTokens': total_cache_write,
        'model':            model,
        'sessionId':        session_id,
        'sessionNote':      'Auto-logged from Cowork session',
        'autoLogged':       True,
    }).encode('utf-8')

    try:
        req = Request(ERP_URL, data=payload, method='POST', headers={
            'Content-Type': 'application/json',
            'x-cron-secret': ERP_SECRET,
        })
        urlopen(req, timeout=10)
    except URLError:
        pass  # ไม่ crash ถ้า ERP ไม่ตอบ

if __name__ == '__main__':
    main()
