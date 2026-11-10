# pawsstore server

Command to start db using docker without compose:

```bash docker run -d \
  --name postgres18 \
  -e POSTGRES_USER=paws-store-user \
  -e POSTGRES_PASSWORD=paws-store-password \
  -e POSTGRES_DB=paws-store-db \
  -p 5432:5432 \
  postgres:18-alpine
```

Прикаждом изменении схемы в призма:

```bash
    npm run contract:emit
    npm run db:plan
    npm run db:migrate
```
