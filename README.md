# Galaxy Info 2

| ![Galaxy Info](logo.png) | Version 2 of the all-in-one solution to gathering and accessing information about Galaxy. |
| --- | --- |

## Development
### Getting Started
First, you'll need to get the database running:
```
cd server && docker-compose -f devdb.docker-compose.yml up
```

Then, in another terminal, start the TypeScript compiler for the server:
```
cd server && npm run dev1
```

Now, copy `server/.env.example` to `server/.env` and replace the empty values with valid values from Discord.

In a third terminal, start the server:
```
cd server && npm run dev2
```

In a fourth terminal, start the web frontend:
```
cd web-client && VUE_APP_API=http://localhost:3000/api npm run serve
```