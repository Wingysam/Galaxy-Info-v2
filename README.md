# Galaxy Info 2

| ![Galaxy Info](logo.png) | Version 2 of the all-in-one solution to gathering and accessing information about Galaxy. |
| --- | --- |

## API Documentation

Interactive API documentation is available via Swagger UI at `/api-docs` when the server is running (e.g., `http://localhost:3000/api-docs`).

The API provides endpoints for:
- Ships and turrets data
- Kill logs and statistics
- Guild configuration
- Game constants
- Galaxypedia integration

## Development
### Getting Started
First, install dependencies with npm:
```
(cd server && npm install) && (cd web-client && npm install --force)
```

Now, copy `server/.env.example` to `server/.env` and replace the empty values with valid values from Discord.

You'll need to get the database running:
```
cd server && docker-compose -f devdb.docker-compose.yml up
```

If your DB hasn't been initialized yet, you'll need to do that:
```
cd server && npx prisma db push
```

Then, in another terminal, start the TypeScript compiler for the server:
```
cd server && npm run dev1
```

In a third terminal, start the server:
```
cd server && npm run dev2
```

In a fourth terminal, start the web frontend:
```
cd web-client && NODE_OPTIONS=--openssl-legacy-provider VUE_APP_API=http://localhost:3000/api npm run serve
```