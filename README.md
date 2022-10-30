# Galaxy Info 2

| ![Galaxy Info](logo.png) | Version 2 of the all-in-one solution to gathering and fetching information about Galaxy. |
| --- | --- |

## Dev
run each of these in a different terminal:
```
cd server && docker-compose -f devdb.docker-compose.yml up
cd server && npm run dev1
cd server && npm run dev2
cd web-client && VUE_APP_API=http://localhost:3000/api npm run serve
```