/* eslint-disable spaced-comment */

// This file is part of the @egomobile/http-prometheus distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// @egomobile/http-prometheus is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// @egomobile/http-prometheus is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import type { HttpMethod, HttpMiddleware, HttpRequestHandler, HttpRequestPath, IHttpServer } from "@egomobile/http-server";
import promClient from "prom-client";
import type { Nilable } from "./types/internal";
import { asAsync, isNil } from "./utils/internal";

/**
 * Asynchronious version of `RegistryProvider`.
 *
 * @returns {Promise<promClient.Registry>} The promise with the registry.
 */
export type AsyncRegistryProvider = () => Promise<promClient.Registry>;

/**
 * Provides a registry.
 *
 * @returns {promClient.Registry|PromiseLike<promClient.Registry>} The registry or the promise with it.
 */
export type RegistryProvider = () => promClient.Registry | PromiseLike<promClient.Registry>;

/**
 * Options for `setupPromClient` function.
 */
export interface ISetupPromClientOptions {
    /**
     * A function, returning the registry to use.
     */
    getRegistry?: Nilable<RegistryProvider>;
    /**
     * The custom HTTP method to use for registration.
     *
     * @default "get"
     */
    httpMethod?: Nilable<HttpMethod>;
    /**
     * One or more optional middlewares to use for the endpoint.
     */
    use?: HttpMiddleware[];
}

/**
 * A result of `setupPromClient`.
 */
export interface ISetupPromClientResult {
    /**
     * The asynchronious function, which returns the `promClient.Registry`,
     * which is currently used by the created handler.
     */
    getRegistry: AsyncRegistryProvider;
    /**
     * The created request handler.
     */
    requestHandler: HttpRequestHandler;
}

/**
 * Possible values for 3rd argument of `setupPromClient()` function.
 */
export type SetupPromClientArg3 = ISetupPromClientOptions | HttpMiddleware[] | promClient.Registry | string;

/**
 * Sets up a HTTP server instance, returning metrics for Prometheus compatible clients.
 *
 * @param {IHttpServer} server The server instance.
 * @param {HttpRequestPath} path The path.
 * @param {Nilable<ISetupPromClientOptions>} [options] Additional and custom options.
 * @param {Nilable<promClient.Registry>} [registry] The registry to use.
 * @param {Nilable<HttpMiddleware[]>} [use] One or more additional middlewares to use.
 *
 * @returns {ISetupPromClientResult} The result.
 *
 * @example
 * ```
 * import createServer from "@egomobile/http-server"
 * import { setupPromClient } from "@egomobile/http-prometheus"
 *
 * const app = createServer()
 *
 * // this registers a new GET endpoint
 * // for path `/prometheus`, which uses
 * // a new `Registry` instance of `prom-client`
 * setupPromClient(server, "/prometheus")
 *
 * // ...
 *
 * await app.listen()
 * ```
 */
export function setupPromClient(server: IHttpServer, path: HttpRequestPath): ISetupPromClientResult;
export function setupPromClient(server: IHttpServer, path: HttpRequestPath, httpMethod: Nilable<HttpMethod>): ISetupPromClientResult;
export function setupPromClient(server: IHttpServer, path: HttpRequestPath, use: Nilable<HttpMiddleware[]>): ISetupPromClientResult;
export function setupPromClient(server: IHttpServer, path: HttpRequestPath, options: Nilable<ISetupPromClientOptions>): ISetupPromClientResult;
export function setupPromClient(server: IHttpServer, path: HttpRequestPath, registry: Nilable<promClient.Registry>): ISetupPromClientResult;
export function setupPromClient(server: IHttpServer, path: HttpRequestPath, arg3?: Nilable<SetupPromClientArg3>): ISetupPromClientResult {
    if (server?.isEgoHttpServer !== true) {
        throw new TypeError("server must be a valid e.GO HTTP server instance");
    }

    let httpMethod: HttpMethod = "get";
    const use: HttpMiddleware[] = [];

    let getRegistry: RegistryProvider;
    if (arg3 instanceof promClient.Registry) {
        getRegistry = async () => {
            return arg3 as promClient.Registry;
        };
    }
    else if (Array.isArray(arg3)) {
        use.push(...arg3);
    }
    else if (typeof arg3 === "string") {
        httpMethod = arg3 as HttpMethod;
    }
    else {
        // getRegistry
        if (isNil(arg3?.getRegistry)) {
            // default => create new

            const registry = new promClient.Registry();
            promClient.collectDefaultMetrics({ "register": registry });

            getRegistry = async () => {
                return registry;
            };
        }
        else {
            getRegistry = arg3.getRegistry as RegistryProvider;
        }

        // use
        if (!isNil(arg3?.use)) {
            if (!Array.isArray(arg3?.use)) {
                throw new TypeError("arg3.use must be of type array");
            }

            use.push(...arg3.use);
        }

        // httpMethod
        if (!isNil(arg3?.httpMethod)) {
            if (typeof arg3.httpMethod !== "string") {
                throw new TypeError("arg3.httpMethod must be of type string");
            }

            httpMethod = arg3.httpMethod;
        }
    }

    if (typeof getRegistry !== "function") {
        throw new TypeError("optionsOrRegistry is an invalid value");
    }

    getRegistry = asAsync<AsyncRegistryProvider>(getRegistry);

    const requestHandler = async function (request, response) {
        const registry = await getRegistry();

        const responseData = await registry.metrics();

        response.writeHead(200, {
            "Content-Type": registry.contentType,
            "Content-Length": String(responseData.length)
        });
        response.write(responseData);
    };

    server[httpMethod](path, use, requestHandler);

    return {
        "getRegistry": getRegistry as AsyncRegistryProvider,
        requestHandler
    };
}
