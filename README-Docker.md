# Docker Setup for Salão Frontend

Este documento descreve como executar o frontend do sistema Salão usando Docker e Docker Compose.

## Requisitos

- Docker
- Docker Compose

## Configurações Disponíveis

Existem duas configurações disponíveis:

1. **Produção**: Usa Nginx para servir a aplicação compilada
2. **Desenvolvimento**: Usa o servidor de desenvolvimento Vite com hot-reload

## Executando em Produção

Para executar a aplicação em modo de produção:

```bash
# Construir e iniciar o container
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

A aplicação estará disponível em `http://localhost:8080`.

## Executando em Desenvolvimento

Para executar a aplicação em modo de desenvolvimento com hot-reload:

```bash
# Construir e iniciar o container de desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# Verificar logs
docker-compose -f docker-compose.dev.yml logs -f
```

A aplicação estará disponível em `http://localhost:5173` com hot-reload ativado.

## Configuração de Ambiente

Para configurar variáveis de ambiente, edite os arquivos `docker-compose.yml` ou `docker-compose.dev.yml` e adicione as variáveis necessárias na seção `environment`.

Exemplo:

```yaml
environment:
  - NODE_ENV=production
  - VITE_API_URL=http://backend:8000
```

## Parando os Containers

```bash
# Para o ambiente de produção
docker-compose down

# Para o ambiente de desenvolvimento
docker-compose -f docker-compose.dev.yml down
```

## Reconstruindo após Alterações

Se você fizer alterações no Dockerfile ou nas dependências:

```bash
# Para produção
docker-compose up -d --build

# Para desenvolvimento
docker-compose -f docker-compose.dev.yml up -d --build
```
