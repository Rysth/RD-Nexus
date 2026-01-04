#!/usr/bin/env bash
set -euo pipefail

blue() { echo -e "\033[0;34m[INFO]\033[0m $*"; }
green() { echo -e "\033[0;32m[SUCCESS]\033[0m $*"; }
yellow(){ echo -e "\033[1;33m[WARNING]\033[0m $*"; }
red()   { echo -e "\033[0;31m[ERROR]\033[0m $*"; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    red "No se encontró el comando '$1'. Instálalo y vuelve a intentar."
    exit 1
  fi
}

start_containers() {
  # Crear .env si no existe
  if [[ ! -f ".env" ]]; then
    if [[ -f ".env.example" ]]; then
      blue "Creando .env desde [.env.example](.env.example)..."
      cp .env.example .env
      green ".env creado."
    else
      red "No existe .env ni .env.example. Crea tu .env y vuelve a ejecutar."
      exit 1
    fi
  else
    blue ".env ya existe."
  fi

  # Verificar que client y backend existen
  if [[ ! -d "client" ]]; then
    red "La carpeta 'client' no existe. Asegúrate de que el repositorio esté completo."
    exit 1
  fi

  if [[ ! -d "backend" ]]; then
    red "La carpeta 'backend' no existe. Asegúrate de que el repositorio esté completo."
    exit 1
  fi

  # Exportar variables del .env (líneas KEY=VALUE sin comentarios)
  set -a
  # shellcheck disable=SC2046
  source <(grep -v '^\s*#' .env | sed 's/\r$//') || true
  set +a

  # Parar contenedores previos de este compose (no falla si no existen)
  blue "Deteniendo contenedores previos..."
  docker compose -f docker-compose.dev.yml down || true

  blue "Levantando contenedores de [docker-compose.dev.yml](docker-compose.dev.yml) para desarrollo local..."
  blue "Usando Dockerfile.dev para hot reload en desarrollo."
  docker compose -f docker-compose.dev.yml up --build -d

  # Esperar un momento para que los contenedores se inicien
  blue "Esperando a que los contenedores se inicien..."
  sleep 10

  # En desarrollo, ejecutar migraciones y seeds automáticamente para AdonisJS
  blue "Ejecutando migraciones de AdonisJS..."
  if docker compose -f docker-compose.dev.yml exec backend node ace migration:run; then
    green "Migraciones ejecutadas exitosamente."
  else
    yellow "Error al ejecutar migraciones. Puedes ejecutarlo manualmente con:"
    yellow "docker compose -f docker-compose.dev.yml exec backend node ace migration:run"
  fi

  blue "Ejecutando seeds de AdonisJS para poblar la base de datos de desarrollo..."
  if docker compose -f docker-compose.dev.yml exec backend node ace db:seed; then
    green "Base de datos poblada exitosamente."
  else
    yellow "Error al poblar la base de datos. Puedes ejecutarlo manualmente con:"
    yellow "docker compose -f docker-compose.dev.yml exec backend node ace db:seed"
  fi

  green "============================================"
  green "Servicios levantados exitosamente!"
  green "============================================"
  green "Frontend (React):    http://localhost:5173"
  green "Backend (AdonisJS):  http://localhost:3333"
  green "Mailpit (Email UI):  http://localhost:8025"
  green "============================================"
  green "Admin credentials:"
  green "  Email: admin@example.com"
  green "  Password: password123"
  green "============================================"

  # Mostrar logs en primer plano
  blue "Mostrando logs de los contenedores (Ctrl+C para salir)..."
  docker compose -f docker-compose.dev.yml logs -f
}

main() {
  cd "$ROOT_DIR"

  blue "Verificando dependencias..."
  require_cmd git
  require_cmd docker
  # Verificar plugin docker compose
  if ! docker compose version >/dev/null 2>&1; then
    red "Se requiere 'docker compose' (plugin). Instálalo y vuelve a intentar."
    exit 1
  fi

  start_containers
}

main "$@"