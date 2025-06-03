#!/bin/bash

function show_help() {
    echo "Uso: $0 [opção]"
    echo "Opções:"
    echo "  start    - Inicia o container (padrão)"
    echo "  rebuild  - Reconstrói e reinicia o container"
    echo "  stop     - Para o container"
    echo "  restart  - Reinicia o container"
}

function ensure_data_dir() {
    # Criar diretório de dados se não existir
    mkdir -p data
    chmod 777 data

    # Se o arquivo dados.json existe na raiz, copiar para data/
    if [ -f dados.json ]; then
        cp dados.json data/dados.json
        chmod 666 data/dados.json
    fi
}

function build_and_run() {
    # Construir a imagem
    docker build -t empresa-backend .

    # Executar o container
    docker run -d \
      -p 3000:3000 \
      -v $(pwd)/data:/app/data \
      --name empresa-backend-container \
      empresa-backend

    echo "Container iniciado! Acesse:"
    echo "API: http://localhost:3000"
    echo "Admin: http://localhost:3000/admin"
}

function stop_container() {
    echo "Parando container..."
    docker stop empresa-backend-container 2>/dev/null || true
    docker rm empresa-backend-container 2>/dev/null || true
}

# Processar argumentos
case "${1:-start}" in
    start)
        ensure_data_dir
        if [ ! "$(docker ps -q -f name=empresa-backend-container)" ]; then
            if [ "$(docker ps -aq -f name=empresa-backend-container)" ]; then
                stop_container
            fi
            build_and_run
        else
            echo "Container já está rodando!"
            echo "Use '$0 rebuild' para reconstruir ou '$0 restart' para reiniciar"
        fi
        ;;
    rebuild)
        ensure_data_dir
        stop_container
        build_and_run
        ;;
    stop)
        stop_container
        ;;
    restart)
        docker restart empresa-backend-container
        echo "Container reiniciado!"
        ;;
    *)
        show_help
        exit 1
        ;;
esac
