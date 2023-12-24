
FROM node:21.5.0-alpine3.19 as builder

WORKDIR /workspace

COPY . . 

RUN npm install && npm run build --mode production

FROM nginx:stable-alpine as runner
COPY --from=builder /workspace/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]