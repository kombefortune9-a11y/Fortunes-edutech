FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install react-is --legacy-peer-deps
COPY . .
RUN npm run build
RUN npm install -g serve
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "serve -s dist -l ${PORT}"]