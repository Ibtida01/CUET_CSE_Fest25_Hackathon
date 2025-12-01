# Docker Services:
#   up - Start services (use: make up [service...] or make up MODE=prod, ARGS="--build" for options)
#   down - Stop services (use: make down [service...] or make down MODE=prod, ARGS="--volumes" for options)
#   build - Build containers (use: make build [service...] or make build MODE=prod)
#   logs - View logs (use: make logs [service] or make logs SERVICES=backend, MODE=prod for production)
#   restart - Restart services (use: make restart [service...] or make restart MODE=prod)
#   shell - Open shell in container (use: make shell SERVICE=gateway, MODE=prod, default: backend)
#   ps - Show running containers (use MODE=prod for production)
#
# Convenience Aliases (Development):
#   dev-up - Alias: Start development environment
#   dev-down - Alias: Stop development environment
#   dev-build - Alias: Build development containers
#   dev-logs - Alias: View development logs
#   dev-restart - Alias: Restart development services
#   dev-shell - Alias: Open shell in backend container
#   dev-ps - Alias: Show running development containers
#   backend-shell - Alias: Open shell in backend container
#   gateway-shell - Alias: Open shell in gateway container
#   mongo-shell - Open MongoDB shell
#
# Convenience Aliases (Production):
#   prod-up - Alias: Start production environment
#   prod-down - Alias: Stop production environment
#   prod-build - Alias: Build production containers
#   prod-logs - Alias: View production logs
#   prod-restart - Alias: Restart production services
#
# Backend:
#   backend-build - Build backend TypeScript
#   backend-install - Install backend dependencies
#   backend-type-check - Type check backend code
#   backend-dev - Run backend in development mode (local, not Docker)
#
# Database:
#   db-reset - Reset MongoDB database (WARNING: deletes all data)
#   db-backup - Backup MongoDB database
#
# Cleanup:
#   clean - Remove containers and networks (both dev and prod)
#   clean-all - Remove containers, networks, volumes, and images
#   clean-volumes - Remove all volumes
#
# Utilities:
#   status - Alias for ps
#   health - Check service health
#
# Help:
#   help - Display this help message

MODE ?= dev
SERVICES ?=
ARGS ?=
SERVICE ?=

ifeq ($(MODE),prod)
  COMPOSE_FILE = docker/compose.production.yaml
else
  COMPOSE_FILE = docker/compose.development.yaml
endif

.PHONY: up down build logs restart shell ps \
        dev-up dev-down dev-build dev-logs dev-restart dev-shell dev-ps \
        backend-shell gateway-shell mongo-shell \
        prod-up prod-down prod-build prod-logs prod-restart \
        backend-build backend-install backend-type-check backend-dev \
        db-reset db-backup \
        clean clean-all clean-volumes status health help

# Core docker compose commands

up:
	docker compose -f $(COMPOSE_FILE) up -d $(SERVICES) $(ARGS)

down:
	docker compose -f $(COMPOSE_FILE) down $(ARGS)

build:
	docker compose -f $(COMPOSE_FILE) build $(SERVICES)

logs:
	docker compose -f $(COMPOSE_FILE) logs -f $(SERVICES)

restart:
	docker compose -f $(COMPOSE_FILE) restart $(SERVICES)

shell:
	@svc=$(if $(SERVICE),$(SERVICE),backend); \
	docker compose -f $(COMPOSE_FILE) exec $$svc sh

ps:
	docker compose -f $(COMPOSE_FILE) ps

# Convenience aliases (development)

dev-up: MODE=dev
dev-up: up

dev-down: MODE=dev
dev-down: down

dev-build: MODE=dev
dev-build: build

dev-logs: MODE=dev
dev-logs: logs

dev-restart: MODE=dev
dev-restart: restart

dev-shell: MODE=dev
dev-shell: shell

dev-ps: MODE=dev
dev-ps: ps

backend-shell:
	$(MAKE) dev-shell SERVICE=backend

gateway-shell:
	$(MAKE) dev-shell SERVICE=gateway

mongo-shell:
	$(MAKE) dev-shell SERVICE=mongo

# Convenience aliases (production)

prod-up: MODE=prod
prod-up: up

prod-down: MODE=prod
prod-down: down

prod-build: MODE=prod
prod-build: build

prod-logs: MODE=prod
prod-logs: logs

prod-restart: MODE=prod
prod-restart: restart

# Backend helpers (local, non-Docker)

backend-install:
	cd backend && npm install

backend-build:
	cd backend && npm run build

backend-type-check:
	# Adjust this if your package.json uses a different script name
	cd backend && npm run type-check

backend-dev:
	cd backend && npm run dev

# Database helpers (stubs: you can improve if you have time)

db-reset:
	@echo "db-reset: implement dropping MongoDB database here if desired."

db-backup:
	@echo "db-backup: implement mongodump backup here if desired."

# Cleanup

clean:
	docker compose -f docker/compose.development.yaml down
	docker compose -f docker/compose.production.yaml down

clean-all:
	docker compose -f docker/compose.development.yaml down --volumes --rmi local
	docker compose -f docker/compose.production.yaml down --volumes --rmi local

clean-volumes:
	docker volume prune -f

# Utilities

status: ps

health:
	@echo "Gateway health:"
	@curl -s http://localhost:5921/health || echo " (failed)"
	@echo
	@echo "Backend health via gateway:"
	@curl -s http://localhost:5921/api/health || echo " (failed)"
	@echo

help:
	@echo "Available targets:"
	@echo "  up / down / build / logs / restart / shell / ps"
	@echo "  dev-up / dev-down / dev-build / dev-logs / dev-restart / dev-shell / dev-ps"
	@echo "  prod-up / prod-down / prod-build / prod-logs / prod-restart"
	@echo "  backend-install / backend-build / backend-type-check / backend-dev"
	@echo "  backend-shell / gateway-shell / mongo-shell"
	@echo "  db-reset / db-backup"
	@echo "  clean / clean-all / clean-volumes"
	@echo "  status / health / help"
	@echo
	@echo "Examples:"
	@echo "  make dev-up"
	@echo "  make dev-logs SERVICES=gateway"
	@echo "  make prod-up"
	@echo "  make logs SERVICES=backend MODE=prod"
