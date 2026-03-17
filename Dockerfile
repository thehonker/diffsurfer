FROM docker.io/node:24-alpine

USER node

WORKDIR /app

COPY --chown=node:node . /app

ENV NODE_ENV=production

RUN --mount=type=secret,id=GITHUB_TOKEN,env=GITHUB_TOKEN \
  set -exu \
  && echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" | tee -a .npmrc

RUN set -exu \
  && cd /app \
  && npm install \
  && rm -f .npmrc

ENTRYPOINT ["/bin/sh"]

CMD ["-c", "npm run server"]
