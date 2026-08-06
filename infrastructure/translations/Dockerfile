ARG NODE_IMAGE=node:22.22.3-alpine3.24

FROM ${NODE_IMAGE} AS deps

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=true
WORKDIR /repo

COPY package.json ./
RUN corepack enable pnpm

COPY . .

RUN pnpm --filter=@budget-forecast/translations deploy --legacy --prod --frozen-lockfile /out

# -------------------------------------------------------------------- app -----
FROM ${NODE_IMAGE} AS app

WORKDIR /app
ENV PORT=4000

COPY --from=deps /out/node_modules ./node_modules
COPY infrastructure/translations/package.json ./package.json
COPY infrastructure/translations/server ./server
COPY infrastructure/translations/projects ./projects

RUN rm -rf ./node_modules/.pnpm/node_modules/@budget-forecast \
 && node --input-type=module \
      -e "await import('/app/server/src/app.ts'); console.log('resolve + type-strip OK')"

USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

FROM app AS dev
ENV NODE_ENV=development
CMD ["node", "--watch", "server/src/index.ts"]

FROM app AS runtime
ENV NODE_ENV=production
CMD ["node", "server/src/index.ts"]
