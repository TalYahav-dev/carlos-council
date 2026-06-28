FROM node:22-slim

WORKDIR /app

ARG NEXT_PUBLIC_SPLINE_SCENE_URL=""
ENV NEXT_PUBLIC_SPLINE_SCENE_URL=${NEXT_PUBLIC_SPLINE_SCENE_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
