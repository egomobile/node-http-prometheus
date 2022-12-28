[![npm](https://img.shields.io/npm/v/@egomobile/http-prometheus.svg)](https://www.npmjs.com/package/@egomobile/http-prometheus)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/egomobile/http-prometheus/pulls)

# @egomobile/http-prometheus

> Sets up [prom-client](https://www.npmjs.com/package/prom-client)s for [@egomobile/http-server](https://www.npmjs.com/package/@egomobile/http-server) instances.

<a name="toc"></a>

## Table of contents

- [Install](#install)
- [Usage](#usage)
- [Credits](#credits)
- [Documentation](#documentation)
- [See also](#see-also)

<a name="install"></a>

## Install [<a href="#toc">↑</a>]

Execute the following command from your project folder, where your `package.json` file is stored:

```bash
npm install --save @egomobile/http-prometheus
```

<a name="usage"></a>

## Usage [<a href="#toc">↑</a>]

<a name="quick-example"></a>

### Quick example [<a href="#usage">↑</a>]

```typescript
import createServer from "@egomobile/http-server";
import { setupPromClient } from "@egomobile/http-prometheus";

const app = createServer();

// this registers a new GET endpoint
// for path `/prometheus`, which uses
// a new `Registry` instance of `prom-client`
setupPromClient(server, "/prometheus");

// ...

await app.listen();
```

<a name="credits"></a>

## Credits [<a href="#toc">↑</a>]

The module makes use of:

- [prom-client](https://www.npmjs.com/package/prom-client)

<a name="documentation"></a>

## Documentation [<a href="#toc">↑</a>]

The API documentation can be found
[here](https://egomobile.github.io/node-http-prometheus/).
