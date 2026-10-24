FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "npm run preview -- --host 0.0.0.0 --port ${PORT}"]