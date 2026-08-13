FROM node:22-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json yarn.lock ./

RUN corepack enable && yarn install --frozen-lockfile && yarn cache clean

COPY . .

RUN yarn build

CMD ["yarn", "docker-start"]
