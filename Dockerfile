# stage 1: build
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# stage 2: extract dist
FROM alpine:latest

WORKDIR /app

COPY --from=build /app/dist ./dist