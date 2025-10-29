# Dynamic Field Note - Makefile
# ガイドライン準拠版運用スクリプト

.PHONY: help up down restart ps logs logs-expo logs-sb clean config test

# デフォルトターゲット（ヘルプ表示）
help:
	@echo "Dynamic Field Note - Docker運用コマンド"
	@echo ""
	@echo "使い方:"
	@echo "  make up         - 全サービス起動（Traefik + Expo + Storybook）"
	@echo "  make down       - 全サービス停止"
	@echo "  make restart    - 全サービス再起動"
	@echo "  make ps         - サービス状態確認"
	@echo "  make logs       - 全ログ表示（リアルタイム）"
	@echo "  make logs-expo  - Expoログのみ表示"
	@echo "  make logs-sb    - Storybookログのみ表示"
	@echo "  make clean      - コンテナ・ボリューム削除（完全クリーンアップ）"
	@echo "  make config     - docker-compose.yml検証"
	@echo "  make test       - 動作確認（URLアクセステスト）"
	@echo ""

# サービス起動
up:
	@echo "🚀 サービスを起動しています..."
	docker compose up -d
	@echo ""
	docker compose ps
	@echo ""
	@echo "✅ 起動完了！以下のURLでアクセスできます："
	@echo "  Expo (Metro): http://expo.localhost"
	@echo "  Expo Dev:     http://expo-dev.localhost"
	@echo "  Storybook:    http://storybook.localhost"
	@echo ""

# サービス停止
down:
	@echo "🛑 サービスを停止しています..."
	docker compose down
	@echo "✅ 停止完了"

# サービス再起動
restart:
	@echo "🔄 サービスを再起動しています..."
	docker compose restart
	docker compose ps
	@echo "✅ 再起動完了"

# サービス状態確認
ps:
	docker compose ps

# 全ログ表示
logs:
	docker compose logs -f --tail=100

# Expoログのみ
logs-expo:
	docker compose logs -f --tail=100 expo

# Storybookログのみ
logs-sb:
	docker compose logs -f --tail=100 storybook

# 完全クリーンアップ
clean:
	@echo "🗑️  コンテナ・ボリュームを削除しています..."
	docker compose down -v --remove-orphans
	@echo "✅ クリーンアップ完了"

# docker-compose.yml検証
config:
	@echo "🔍 docker-compose.yml を検証しています..."
	docker compose config
	@echo ""
	@echo "✅ 検証OK"

# 動作確認テスト
test:
	@echo "🧪 動作確認テストを実行中..."
	@echo ""
	@echo "1. Expoにアクセス..."
	@curl -f -s -o /dev/null -w "  Status: %{http_code}\n" http://expo.localhost || echo "  ❌ 接続失敗"
	@echo ""
	@echo "2. Storybookにアクセス..."
	@curl -f -s -o /dev/null -w "  Status: %{http_code}\n" http://storybook.localhost || echo "  ❌ 接続失敗"
	@echo ""
	@echo "✅ テスト完了"
