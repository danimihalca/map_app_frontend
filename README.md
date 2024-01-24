# Map App frontend

## Description
Frontend layer for MapApp using Mapbox GL JS directly.

Feature set:
- display a map
- set a current location via:
    - long press/touch for at least 1s on map
    - location input box
    - ask for geolocation from browser (working only on local environments, would require SSL which is not yet covered here)
- perform a simple search
- calculate and display a route from the current location to a search result

> [!IMPORTANT]
> The current implementation is just a prototype which allowed fast testing and integration with the services, code quality wasn't a priority, it does not respect best practices for these frontend technologies or UI/UX principles, nor was it written in the most idiomatic way.

## Technologies
- Typescript
- React
- npm

## Build

### Local build
- Install node 21
- Specify services location in `.env.development` if they are needed, e.g.:
```
REACT_APP_SEARCH_API_ENDPOINT=http://localhost:12345
REACT_APP_NAVIGATION_API_ENDPOINT=http://localhost:3000
```

- Build application:
```
npm start
```

### Build via Docker
```
docker build --target runner -t <FRONTEND_IMG> .
```
> [!NOTE]
> The Docker build is designated for production and requires that search and navigation services are accessbile via `http://search-service:12345` and
 `http://navigation-service:3000`