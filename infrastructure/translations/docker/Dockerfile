ARG NODE_IMAGE=node:22.22.3-alpine3.24

FROM ${NODE_IMAGE} AS deps

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /repo

COPY . .
RUN corepack enable pnpm \
 && pnpm --filter=@monorepo/translations deploy --legacy --prod --frozen-lockfile /out

# ------------------------------------------------------------------------------
FROM ${NODE_IMAGE}

WORKDIR /app
ENV NODE_ENV=production PORT=4000

COPY --from=deps /out/node_modules ./node_modules
COPY infrastructure/translations/package.json ./package.json
COPY infrastructure/translations/server ./server
COPY infrastructure/translations/projects ./projects

USER node
EXPOSE 4000
CMD ["node", "server/src/index.ts"]
