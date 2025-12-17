#!/bin/bash

# GTK 초기화를 위한 환경변수 설정
export GDK_BACKEND=x11
export DISPLAY=${DISPLAY:-:0}

# DevTunnel 바이너리 경로 (필요시 수정)
export DEVTUNNEL_BIN="${DEVTUNNEL_BIN:-/home/bch/bin/devtunnel}"

echo "======================================"
echo "DevTunnel GUI - Development Mode"
echo "======================================"
echo "DISPLAY: $DISPLAY"
echo "GDK_BACKEND: $GDK_BACKEND"
echo "DEVTUNNEL_BIN: $DEVTUNNEL_BIN"
echo "======================================"
echo ""

# X11 권한 부여 (선택사항)
if command -v xhost &> /dev/null; then
    xhost +local: 2>/dev/null || true
fi

# Tauri 개발 서버 실행
npm run tauri dev
