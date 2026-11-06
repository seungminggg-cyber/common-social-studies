#!/bin/bash
# 클라우드 작업 환경 준비 — 새 세션이 열릴 때 환경 설정의 '준비 스크립트'가 이 파일을 부른다.
#   (환경 설정 준비 스크립트 칸: if [ -d common-social-studies ]; then bash common-social-studies/scripts/setup-env.sh; fi)
# 하는 일: 앱·개념서 부품 설치, 한글 파일 도구(python-hwpx)·글꼴 도구 설치, 인쇄용 글꼴 변환.
# 실패해도 세션은 열리도록 단계마다 따로 돌리고 결과만 적는다.
cd "$(dirname "$0")/.." || exit 0
step() { echo "== $1"; shift; "$@" >>/tmp/setup-env.log 2>&1 && echo "   완료" || echo "   실패(로그 /tmp/setup-env.log)"; }
step "앱 부품(npm)" npm install --no-save --no-audit --no-fund
step "개념서 부품(npm)" bash -c "cd textbook && npm install --no-save --no-audit --no-fund"
step "한글 파일·글꼴 도구(pip)" pip install -q python-hwpx==6.11.0 fonttools
step "인쇄용 글꼴 변환" bash -c "cd 기출변형 && python3 cover/otf2ttf.py"
exit 0
