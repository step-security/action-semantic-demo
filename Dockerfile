FROM golang:1.23-alpine@sha256:9a425d78a8257fc92d41ad979d38cb54005bac3fdefbdadde868e004eccbb898 AS go-builder

ENV REVIEWDOG_VERSION=v0.20.3

RUN apk add --no-cache git \
    && git clone --depth 1 --branch ${REVIEWDOG_VERSION} https://github.com/reviewdog/reviewdog.git /reviewdog \
    && cd /reviewdog \
    && go mod edit -require=golang.org/x/crypto@v0.35.0 \
    && go mod tidy \
    && CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o reviewdog ./cmd/reviewdog

FROM node:22-alpine@sha256:41e4389f3d988d2ed55392df4db1420ad048ae53324a8e2b7c6d19508288107e

ENV MARKDOWNLINT_CLI_VERSION=v0.42.0

RUN npm install -g "markdownlint-cli@$MARKDOWNLINT_CLI_VERSION"

RUN apk add --no-cache \
        ca-certificates \
        git \
        wget \
        curl

COPY --from=go-builder /reviewdog/reviewdog /usr/local/bin/reviewdog

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD []
