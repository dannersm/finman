.PHONY: help setup start stop restart logs build dev clean

# Default target
help:
	@echo "FinMan Management Commands:"
	@echo "  make setup    - Initialize configuration (creates .env from example)"
	@echo "  make start    - Start the application (Docker)"
	@echo "  make stop     - Stop the application"
	@echo "  make restart  - Restart the application"
	@echo "  make logs     - View application logs (excludes database logs)"
	@echo "  make build    - Rebuild Docker images"
	@echo "  make dev      - Run locally (requires Node.js & MongoDB)"
	@echo "  make clean    - Stop and remove containers and volumes"

setup:
	@if [ ! -f .env ]; then cp .env.example .env && echo "Created .env file. Please edit it with your credentials."; else echo ".env already exists."; fi

start:
	docker-compose up -d
	@echo "FinMan started! Visit http://localhost:3000"

stop:
	docker-compose down

restart: stop start

logs:
	docker-compose logs -f frontend scraper

build:
	docker-compose build

dev:
	npm install
	npm run dev

clean:
	docker-compose down -v
