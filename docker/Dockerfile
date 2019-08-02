FROM node:8-alpine

RUN apk add --update --no-cache git \
                                libzmq \
                                zeromq-dev \
                                python \
                                make \
                                g++

WORKDIR /insight

# Copy quantisnetcore-node
RUN git clone --branch master --single-branch --depth 1 https://github.com/quantisnetevo/quantisnetcore-node.git .

# Copy config file
COPY quantisnetcore-node.json .

# Install NPM modules
RUN npm ci

ARG VERSION
ARG MAJOR_VERSION

# Install Insight modules
RUN bin/quantisnetcore-node install @quantisnetevo/insight-api@${MAJOR_VERSION}
RUN bin/quantisnetcore-node install @quantisnetevo/insight-ui@${VERSION}

FROM node:8-alpine

LABEL maintainer="Dash Developers <dev@quantisnet.org>"
LABEL description="Dockerised Insight-Dash"

WORKDIR /insight

# Copy project files
COPY --from=0 /insight/ .

EXPOSE 3001

CMD ["bin/quantisnetcore-node", "start"]
