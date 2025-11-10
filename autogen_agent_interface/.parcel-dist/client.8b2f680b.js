import * as __parcelExternal0 from "react/jsx-dev-runtime";
import * as __parcelExternal1 from "@/lib/trpc";
import * as __parcelExternal2 from "@shared/const";
import * as __parcelExternal3 from "@tanstack/react-query";
import * as __parcelExternal4 from "@trpc/client";
import * as __parcelExternal5 from "react-dom/client";
import * as __parcelExternal6 from "superjson";
import * as __parcelExternal7 from "@/components/ui/sonner";
import * as __parcelExternal8 from "@/components/ui/tooltip";
import * as __parcelExternal9 from "@/pages/NotFound";
import * as __parcelExternal10 from "wouter";
import * as __parcelExternal11 from "@/lib/utils";
import * as __parcelExternal12 from "lucide-react";
import * as __parcelExternal13 from "react";
import * as __parcelExternal14 from "@/_core/hooks/useAuth";
import * as __parcelExternal15 from "@/components/ui/button";
import * as __parcelExternal16 from "@/const";
import * as __parcelExternal17 from "@/components/Sidebar";
import * as __parcelExternal18 from "@/components/AdvancedChatInterface";
import * as __parcelExternal19 from "@/components/RightPanel";
import * as __parcelExternal20 from "@/components/AgentTeamVisualization";
import * as __parcelExternal21 from "@/hooks/useMobile";
import * as __parcelExternal22 from "@/hooks/usePWA";
import * as __parcelExternal23 from "@/hooks/useFullscreen";
import * as __parcelExternal24 from "@/components/HeroSection";
import * as __parcelExternal25 from "@/components/GlassCard";
import * as __parcelExternal26 from "@/components/3DAgentCard";
import * as __parcelExternal27 from "framer-motion";
import * as __parcelExternal28 from "@/components/FloatingOrb";
// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (
  modules,
  entry,
  mainEntry,
  parcelRequireName,
  externals,
  distDir,
  publicUrl,
  devServer
) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var importMap = previousRequire.i || {};
  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        if (externals[name]) {
          return externals[name];
        }
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        globalObject
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      if (res === false) {
        return {};
      }
      // Synthesize a module to follow re-exports.
      if (Array.isArray(res)) {
        var m = {__esModule: true};
        res.forEach(function (v) {
          var key = v[0];
          var id = v[1];
          var exp = v[2] || v[0];
          var x = newRequire(id);
          if (key === '*') {
            Object.keys(x).forEach(function (key) {
              if (
                key === 'default' ||
                key === '__esModule' ||
                Object.prototype.hasOwnProperty.call(m, key)
              ) {
                return;
              }

              Object.defineProperty(m, key, {
                enumerable: true,
                get: function () {
                  return x[key];
                },
              });
            });
          } else if (exp === '*') {
            Object.defineProperty(m, key, {
              enumerable: true,
              value: x,
            });
          } else {
            Object.defineProperty(m, key, {
              enumerable: true,
              get: function () {
                if (exp === 'default') {
                  return x.__esModule ? x.default : x;
                }
                return x[exp];
              },
            });
          }
        });
        return m;
      }
      return newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.require = nodeRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.distDir = distDir;
  newRequire.publicUrl = publicUrl;
  newRequire.devServer = devServer;
  newRequire.i = importMap;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  // Only insert newRequire.load when it is actually used.
  // The code in this file is linted against ES5, so dynamic import is not allowed.
  // INSERT_LOAD_HERE

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });
    }
  }
})({"6R0pI":[function(require,module,exports,__globalThis) {
var HMR_HOST = null;
var HMR_PORT = 1234;
var HMR_SERVER_PORT = 1234;
var HMR_SECURE = false;
var HMR_ENV_HASH = "f0eb5e163720f74c";
var HMR_USE_SSE = false;
module.bundle.HMR_BUNDLE_ID = "1dc7e71d8b2f680b";
"use strict";
/* global HMR_HOST, HMR_PORT, HMR_SERVER_PORT, HMR_ENV_HASH, HMR_SECURE, HMR_USE_SSE, chrome, browser, __parcel__import__, __parcel__importScripts__, ServiceWorkerGlobalScope */ /*::
import type {
  HMRAsset,
  HMRMessage,
} from '@parcel/reporter-dev-server/src/HMRServer.js';
interface ParcelRequire {
  (string): mixed;
  cache: {|[string]: ParcelModule|};
  hotData: {|[string]: mixed|};
  Module: any;
  parent: ?ParcelRequire;
  isParcelRequire: true;
  modules: {|[string]: [Function, {|[string]: string|}]|};
  HMR_BUNDLE_ID: string;
  root: ParcelRequire;
}
interface ParcelModule {
  hot: {|
    data: mixed,
    accept(cb: (Function) => void): void,
    dispose(cb: (mixed) => void): void,
    // accept(deps: Array<string> | string, cb: (Function) => void): void,
    // decline(): void,
    _acceptCallbacks: Array<(Function) => void>,
    _disposeCallbacks: Array<(mixed) => void>,
  |};
}
interface ExtensionContext {
  runtime: {|
    reload(): void,
    getURL(url: string): string;
    getManifest(): {manifest_version: number, ...};
  |};
}
declare var module: {bundle: ParcelRequire, ...};
declare var HMR_HOST: string;
declare var HMR_PORT: string;
declare var HMR_SERVER_PORT: string;
declare var HMR_ENV_HASH: string;
declare var HMR_SECURE: boolean;
declare var HMR_USE_SSE: boolean;
declare var chrome: ExtensionContext;
declare var browser: ExtensionContext;
declare var __parcel__import__: (string) => Promise<void>;
declare var __parcel__importScripts__: (string) => Promise<void>;
declare var globalThis: typeof self;
declare var ServiceWorkerGlobalScope: Object;
*/ var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;
function Module(moduleName) {
    OldModule.call(this, moduleName);
    this.hot = {
        data: module.bundle.hotData[moduleName],
        _acceptCallbacks: [],
        _disposeCallbacks: [],
        accept: function(fn) {
            this._acceptCallbacks.push(fn || function() {});
        },
        dispose: function(fn) {
            this._disposeCallbacks.push(fn);
        }
    };
    module.bundle.hotData[moduleName] = undefined;
}
module.bundle.Module = Module;
module.bundle.hotData = {};
var checkedAssets /*: {|[string]: boolean|} */ , disposedAssets /*: {|[string]: boolean|} */ , assetsToDispose /*: Array<[ParcelRequire, string]> */ , assetsToAccept /*: Array<[ParcelRequire, string]> */ , bundleNotFound = false;
function getHostname() {
    return HMR_HOST || (typeof location !== 'undefined' && location.protocol.indexOf('http') === 0 ? location.hostname : 'localhost');
}
function getPort() {
    return HMR_PORT || (typeof location !== 'undefined' ? location.port : HMR_SERVER_PORT);
}
// eslint-disable-next-line no-redeclare
let WebSocket = globalThis.WebSocket;
if (!WebSocket && typeof module.bundle.root === 'function') try {
    // eslint-disable-next-line no-global-assign
    WebSocket = module.bundle.root('ws');
} catch  {
// ignore.
}
var hostname = getHostname();
var port = getPort();
var protocol = HMR_SECURE || typeof location !== 'undefined' && location.protocol === 'https:' && ![
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
].includes(hostname) ? 'wss' : 'ws';
// eslint-disable-next-line no-redeclare
var parent = module.bundle.parent;
if (!parent || !parent.isParcelRequire) {
    // Web extension context
    var extCtx = typeof browser === 'undefined' ? typeof chrome === 'undefined' ? null : chrome : browser;
    // Safari doesn't support sourceURL in error stacks.
    // eval may also be disabled via CSP, so do a quick check.
    var supportsSourceURL = false;
    try {
        (0, eval)('throw new Error("test"); //# sourceURL=test.js');
    } catch (err) {
        supportsSourceURL = err.stack.includes('test.js');
    }
    var ws;
    if (HMR_USE_SSE) ws = new EventSource('/__parcel_hmr');
    else try {
        // If we're running in the dev server's node runner, listen for messages on the parent port.
        let { workerData, parentPort } = module.bundle.root('node:worker_threads') /*: any*/ ;
        if (workerData !== null && workerData !== void 0 && workerData.__parcel) {
            parentPort.on('message', async (message)=>{
                try {
                    await handleMessage(message);
                    parentPort.postMessage('updated');
                } catch  {
                    parentPort.postMessage('restart');
                }
            });
            // After the bundle has finished running, notify the dev server that the HMR update is complete.
            queueMicrotask(()=>parentPort.postMessage('ready'));
        }
    } catch  {
        if (typeof WebSocket !== 'undefined') try {
            ws = new WebSocket(protocol + '://' + hostname + (port ? ':' + port : '') + '/');
        } catch (err) {
            // Ignore cloudflare workers error.
            if (err.message && !err.message.includes('Disallowed operation called within global scope')) console.error(err.message);
        }
    }
    if (ws) {
        // $FlowFixMe
        ws.onmessage = async function(event /*: {data: string, ...} */ ) {
            var data /*: HMRMessage */  = JSON.parse(event.data);
            await handleMessage(data);
        };
        if (ws instanceof WebSocket) {
            ws.onerror = function(e) {
                if (e.message) console.error(e.message);
            };
            ws.onclose = function() {
                console.warn("[parcel] \uD83D\uDEA8 Connection to the HMR server was lost");
            };
        }
    }
}
async function handleMessage(data /*: HMRMessage */ ) {
    checkedAssets = {} /*: {|[string]: boolean|} */ ;
    disposedAssets = {} /*: {|[string]: boolean|} */ ;
    assetsToAccept = [];
    assetsToDispose = [];
    bundleNotFound = false;
    if (data.type === 'reload') fullReload();
    else if (data.type === 'update') {
        // Remove error overlay if there is one
        if (typeof document !== 'undefined') removeErrorOverlay();
        let assets = data.assets;
        // Handle HMR Update
        let handled = assets.every((asset)=>{
            return asset.type === 'css' || asset.type === 'js' && hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle);
        });
        // Dispatch a custom event in case a bundle was not found. This might mean
        // an asset on the server changed and we should reload the page. This event
        // gives the client an opportunity to refresh without losing state
        // (e.g. via React Server Components). If e.preventDefault() is not called,
        // we will trigger a full page reload.
        if (handled && bundleNotFound && assets.some((a)=>a.envHash !== HMR_ENV_HASH) && typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') handled = !window.dispatchEvent(new CustomEvent('parcelhmrreload', {
            cancelable: true
        }));
        if (handled) {
            console.clear();
            // Dispatch custom event so other runtimes (e.g React Refresh) are aware.
            if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') window.dispatchEvent(new CustomEvent('parcelhmraccept'));
            await hmrApplyUpdates(assets);
            hmrDisposeQueue();
            // Run accept callbacks. This will also re-execute other disposed assets in topological order.
            let processedAssets = {};
            for(let i = 0; i < assetsToAccept.length; i++){
                let id = assetsToAccept[i][1];
                if (!processedAssets[id]) {
                    hmrAccept(assetsToAccept[i][0], id);
                    processedAssets[id] = true;
                }
            }
        } else fullReload();
    }
    if (data.type === 'error') {
        // Log parcel errors to console
        for (let ansiDiagnostic of data.diagnostics.ansi){
            let stack = ansiDiagnostic.codeframe ? ansiDiagnostic.codeframe : ansiDiagnostic.stack;
            console.error("\uD83D\uDEA8 [parcel]: " + ansiDiagnostic.message + '\n' + stack + '\n\n' + ansiDiagnostic.hints.join('\n'));
        }
        if (typeof document !== 'undefined') {
            // Render the fancy html overlay
            removeErrorOverlay();
            var overlay = createErrorOverlay(data.diagnostics.html);
            // $FlowFixMe
            document.body.appendChild(overlay);
        }
    }
}
function removeErrorOverlay() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
        overlay.remove();
        console.log("[parcel] \u2728 Error resolved");
    }
}
function createErrorOverlay(diagnostics) {
    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    let errorHTML = '<div style="background: black; opacity: 0.85; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; font-family: Menlo, Consolas, monospace; z-index: 9999;">';
    for (let diagnostic of diagnostics){
        let stack = diagnostic.frames.length ? diagnostic.frames.reduce((p, frame)=>{
            return `${p}
<a href="${protocol === 'wss' ? 'https' : 'http'}://${hostname}:${port}/__parcel_launch_editor?file=${encodeURIComponent(frame.location)}" style="text-decoration: underline; color: #888" onclick="fetch(this.href); return false">${frame.location}</a>
${frame.code}`;
        }, '') : diagnostic.stack;
        errorHTML += `
      <div>
        <div style="font-size: 18px; font-weight: bold; margin-top: 20px;">
          \u{1F6A8} ${diagnostic.message}
        </div>
        <pre>${stack}</pre>
        <div>
          ${diagnostic.hints.map((hint)=>"<div>\uD83D\uDCA1 " + hint + '</div>').join('')}
        </div>
        ${diagnostic.documentation ? `<div>\u{1F4DD} <a style="color: violet" href="${diagnostic.documentation}" target="_blank">Learn more</a></div>` : ''}
      </div>
    `;
    }
    errorHTML += '</div>';
    overlay.innerHTML = errorHTML;
    return overlay;
}
function fullReload() {
    if (typeof location !== 'undefined' && 'reload' in location) location.reload();
    else if (typeof extCtx !== 'undefined' && extCtx && extCtx.runtime && extCtx.runtime.reload) extCtx.runtime.reload();
    else try {
        let { workerData, parentPort } = module.bundle.root('node:worker_threads') /*: any*/ ;
        if (workerData !== null && workerData !== void 0 && workerData.__parcel) parentPort.postMessage('restart');
    } catch (err) {
        console.error("[parcel] \u26A0\uFE0F An HMR update was not accepted. Please restart the process.");
    }
}
function getParents(bundle, id) /*: Array<[ParcelRequire, string]> */ {
    var modules = bundle.modules;
    if (!modules) return [];
    var parents = [];
    var k, d, dep;
    for(k in modules)for(d in modules[k][1]){
        dep = modules[k][1][d];
        if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) parents.push([
            bundle,
            k
        ]);
    }
    if (bundle.parent) parents = parents.concat(getParents(bundle.parent, id));
    return parents;
}
function updateLink(link) {
    var href = link.getAttribute('href');
    if (!href) return;
    var newLink = link.cloneNode();
    newLink.onload = function() {
        if (link.parentNode !== null) // $FlowFixMe
        link.parentNode.removeChild(link);
    };
    newLink.setAttribute('href', // $FlowFixMe
    href.split('?')[0] + '?' + Date.now());
    // $FlowFixMe
    link.parentNode.insertBefore(newLink, link.nextSibling);
}
var cssTimeout = null;
function reloadCSS() {
    if (cssTimeout || typeof document === 'undefined') return;
    cssTimeout = setTimeout(function() {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for(var i = 0; i < links.length; i++){
            // $FlowFixMe[incompatible-type]
            var href /*: string */  = links[i].getAttribute('href');
            var hostname = getHostname();
            var servedFromHMRServer = hostname === 'localhost' ? new RegExp('^(https?:\\/\\/(0.0.0.0|127.0.0.1)|localhost):' + getPort()).test(href) : href.indexOf(hostname + ':' + getPort());
            var absolute = /^https?:\/\//i.test(href) && href.indexOf(location.origin) !== 0 && !servedFromHMRServer;
            if (!absolute) updateLink(links[i]);
        }
        cssTimeout = null;
    }, 50);
}
function hmrDownload(asset) {
    if (asset.type === 'js') {
        if (typeof document !== 'undefined') {
            let script = document.createElement('script');
            script.src = asset.url + '?t=' + Date.now();
            if (asset.outputFormat === 'esmodule') script.type = 'module';
            return new Promise((resolve, reject)=>{
                var _document$head;
                script.onload = ()=>resolve(script);
                script.onerror = reject;
                (_document$head = document.head) === null || _document$head === void 0 || _document$head.appendChild(script);
            });
        } else if (typeof importScripts === 'function') {
            // Worker scripts
            if (asset.outputFormat === 'esmodule') return import(asset.url + '?t=' + Date.now());
            else return new Promise((resolve, reject)=>{
                try {
                    importScripts(asset.url + '?t=' + Date.now());
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        }
    }
}
async function hmrApplyUpdates(assets) {
    global.parcelHotUpdate = Object.create(null);
    let scriptsToRemove;
    try {
        // If sourceURL comments aren't supported in eval, we need to load
        // the update from the dev server over HTTP so that stack traces
        // are correct in errors/logs. This is much slower than eval, so
        // we only do it if needed (currently just Safari).
        // https://bugs.webkit.org/show_bug.cgi?id=137297
        // This path is also taken if a CSP disallows eval.
        if (!supportsSourceURL) {
            let promises = assets.map((asset)=>{
                var _hmrDownload;
                return (_hmrDownload = hmrDownload(asset)) === null || _hmrDownload === void 0 ? void 0 : _hmrDownload.catch((err)=>{
                    // Web extension fix
                    if (extCtx && extCtx.runtime && extCtx.runtime.getManifest().manifest_version == 3 && typeof ServiceWorkerGlobalScope != 'undefined' && global instanceof ServiceWorkerGlobalScope) {
                        extCtx.runtime.reload();
                        return;
                    }
                    throw err;
                });
            });
            scriptsToRemove = await Promise.all(promises);
        }
        assets.forEach(function(asset) {
            hmrApply(module.bundle.root, asset);
        });
    } finally{
        delete global.parcelHotUpdate;
        if (scriptsToRemove) scriptsToRemove.forEach((script)=>{
            if (script) {
                var _document$head2;
                (_document$head2 = document.head) === null || _document$head2 === void 0 || _document$head2.removeChild(script);
            }
        });
    }
}
function hmrApply(bundle /*: ParcelRequire */ , asset /*:  HMRAsset */ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (asset.type === 'css') reloadCSS();
    else if (asset.type === 'js') {
        let deps = asset.depsByBundle[bundle.HMR_BUNDLE_ID];
        if (deps) {
            if (modules[asset.id]) {
                // Remove dependencies that are removed and will become orphaned.
                // This is necessary so that if the asset is added back again, the cache is gone, and we prevent a full page reload.
                let oldDeps = modules[asset.id][1];
                for(let dep in oldDeps)if (!deps[dep] || deps[dep] !== oldDeps[dep]) {
                    let id = oldDeps[dep];
                    let parents = getParents(module.bundle.root, id);
                    if (parents.length === 1) hmrDelete(module.bundle.root, id);
                }
            }
            if (supportsSourceURL) // Global eval. We would use `new Function` here but browser
            // support for source maps is better with eval.
            (0, eval)(asset.output);
            // $FlowFixMe
            let fn = global.parcelHotUpdate[asset.id];
            modules[asset.id] = [
                fn,
                deps
            ];
        }
        // Always traverse to the parent bundle, even if we already replaced the asset in this bundle.
        // This is required in case modules are duplicated. We need to ensure all instances have the updated code.
        if (bundle.parent) hmrApply(bundle.parent, asset);
    }
}
function hmrDelete(bundle, id) {
    let modules = bundle.modules;
    if (!modules) return;
    if (modules[id]) {
        // Collect dependencies that will become orphaned when this module is deleted.
        let deps = modules[id][1];
        let orphans = [];
        for(let dep in deps){
            let parents = getParents(module.bundle.root, deps[dep]);
            if (parents.length === 1) orphans.push(deps[dep]);
        }
        // Delete the module. This must be done before deleting dependencies in case of circular dependencies.
        delete modules[id];
        delete bundle.cache[id];
        // Now delete the orphans.
        orphans.forEach((id)=>{
            hmrDelete(module.bundle.root, id);
        });
    } else if (bundle.parent) hmrDelete(bundle.parent, id);
}
function hmrAcceptCheck(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    checkedAssets = {};
    if (hmrAcceptCheckOne(bundle, id, depsByBundle)) return true;
    // Traverse parents breadth first. All possible ancestries must accept the HMR update, or we'll reload.
    let parents = getParents(module.bundle.root, id);
    let accepted = false;
    while(parents.length > 0){
        let v = parents.shift();
        let a = hmrAcceptCheckOne(v[0], v[1], null);
        if (a) // If this parent accepts, stop traversing upward, but still consider siblings.
        accepted = true;
        else if (a !== null) {
            // Otherwise, queue the parents in the next level upward.
            let p = getParents(module.bundle.root, v[1]);
            if (p.length === 0) {
                // If there are no parents, then we've reached an entry without accepting. Reload.
                accepted = false;
                break;
            }
            parents.push(...p);
        }
    }
    return accepted;
}
function hmrAcceptCheckOne(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (depsByBundle && !depsByBundle[bundle.HMR_BUNDLE_ID]) {
        // If we reached the root bundle without finding where the asset should go,
        // there's nothing to do. Mark as "accepted" so we don't reload the page.
        if (!bundle.parent) {
            bundleNotFound = true;
            return true;
        }
        return hmrAcceptCheckOne(bundle.parent, id, depsByBundle);
    }
    if (checkedAssets[id]) return null;
    checkedAssets[id] = true;
    var cached = bundle.cache[id];
    if (!cached) return true;
    assetsToDispose.push([
        bundle,
        id
    ]);
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
        assetsToAccept.push([
            bundle,
            id
        ]);
        return true;
    }
    return false;
}
function hmrDisposeQueue() {
    // Dispose all old assets.
    for(let i = 0; i < assetsToDispose.length; i++){
        let id = assetsToDispose[i][1];
        if (!disposedAssets[id]) {
            hmrDispose(assetsToDispose[i][0], id);
            disposedAssets[id] = true;
        }
    }
    assetsToDispose = [];
}
function hmrDispose(bundle /*: ParcelRequire */ , id /*: string */ ) {
    var cached = bundle.cache[id];
    bundle.hotData[id] = {};
    if (cached && cached.hot) cached.hot.data = bundle.hotData[id];
    if (cached && cached.hot && cached.hot._disposeCallbacks.length) cached.hot._disposeCallbacks.forEach(function(cb) {
        cb(bundle.hotData[id]);
    });
    delete bundle.cache[id];
}
function hmrAccept(bundle /*: ParcelRequire */ , id /*: string */ ) {
    // Execute the module.
    bundle(id);
    // Run the accept callbacks in the new version of the module.
    var cached = bundle.cache[id];
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
        let assetsToAlsoAccept = [];
        cached.hot._acceptCallbacks.forEach(function(cb) {
            let additionalAssets = cb(function() {
                return getParents(module.bundle.root, id);
            });
            if (Array.isArray(additionalAssets) && additionalAssets.length) assetsToAlsoAccept.push(...additionalAssets);
        });
        if (assetsToAlsoAccept.length) {
            let handled = assetsToAlsoAccept.every(function(a) {
                return hmrAcceptCheck(a[0], a[1]);
            });
            if (!handled) return fullReload();
            hmrDisposeQueue();
        }
    }
}

},{}],"1TADD":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
var _jsxDevRuntime = require("react/jsx-dev-runtime");
var _trpc = require("@/lib/trpc");
var _const = require("@shared/const");
var _reactQuery = require("@tanstack/react-query");
var _client = require("@trpc/client");
var _client1 = require("react-dom/client");
var _superjson = require("superjson");
var _superjsonDefault = parcelHelpers.interopDefault(_superjson);
var _app = require("./App");
var _appDefault = parcelHelpers.interopDefault(_app);
var _const1 = require("./const");
var _indexCss = require("./index.css");
const queryClient = new (0, _reactQuery.QueryClient)();
const redirectToLoginIfUnauthorized = (error)=>{
    if (!(error instanceof (0, _client.TRPCClientError))) return;
    if (typeof window === "undefined") return;
    const isUnauthorized = error.message === (0, _const.UNAUTHED_ERR_MSG);
    if (!isUnauthorized) return;
    window.location.href = (0, _const1.getLoginUrl)();
};
queryClient.getQueryCache().subscribe((event)=>{
    if (event.type === "updated" && event.action.type === "error") {
        const error = event.query.state.error;
        redirectToLoginIfUnauthorized(error);
        console.error("[API Query Error]", error);
    }
});
queryClient.getMutationCache().subscribe((event)=>{
    if (event.type === "updated" && event.action.type === "error") {
        const error = event.mutation.state.error;
        redirectToLoginIfUnauthorized(error);
        console.error("[API Mutation Error]", error);
    }
});
const trpcClient = (0, _trpc.trpc).createClient({
    links: [
        (0, _client.httpBatchLink)({
            url: "/api/trpc",
            transformer: (0, _superjsonDefault.default),
            fetch (input, init) {
                return globalThis.fetch(input, {
                    ...init ?? {},
                    credentials: "include"
                });
            }
        })
    ]
});
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
// Adicionar tratamento de erro global antes de renderizar
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event)=>{
        console.error('[Global Error]', event.error, event.filename, event.lineno);
    // Não impedir o carregamento, apenas logar
    });
    window.addEventListener('unhandledrejection', (event)=>{
        console.error('[Unhandled Promise Rejection]', event.reason);
    // Não impedir o carregamento, apenas logar
    });
}
try {
    const root = (0, _client1.createRoot)(rootElement);
    root.render(/*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _trpc.trpc).Provider, {
        client: trpcClient,
        queryClient: queryClient,
        children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _reactQuery.QueryClientProvider), {
            client: queryClient,
            children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _appDefault.default), {}, void 0, false, {
                fileName: "client/src/main.tsx",
                lineNumber: 78,
                columnNumber: 9
            }, undefined)
        }, void 0, false, {
            fileName: "client/src/main.tsx",
            lineNumber: 77,
            columnNumber: 7
        }, undefined)
    }, void 0, false, {
        fileName: "client/src/main.tsx",
        lineNumber: 76,
        columnNumber: 5
    }, undefined));
} catch (error) {
    console.error("Error rendering app:", error);
    // Exibir erro de forma mais visível
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : String(error);
    rootElement.innerHTML = `
    <div style="padding: 20px; color: white; background: #1a1a1a; min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; font-family: system-ui, sans-serif;">
      <h1 style="font-size: 24px; margin-bottom: 16px; color: #ff6b6b;">Erro ao carregar aplica\xe7\xe3o</h1>
      <p style="color: #ffd93d; margin-bottom: 16px;">${errorMessage}</p>
      <details style="width: 100%; max-width: 800px; margin-bottom: 16px;">
        <summary style="cursor: pointer; color: #74c0fc; margin-bottom: 8px;">Detalhes do erro</summary>
        <pre style="background: #2a2a2a; padding: 16px; border-radius: 8px; overflow: auto; color: #ccc; font-size: 12px; margin-top: 8px;">${errorStack}</pre>
      </details>
      <button onclick="window.location.reload()" style="margin-top: 16px; padding: 12px 24px; background: #8a2be2; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">Recarregar P\xe1gina</button>
      <p style="margin-top: 16px; color: #888; font-size: 14px;">Se o problema persistir, verifique o console do navegador para mais detalhes.</p>
    </div>
  `;
}

},{"react/jsx-dev-runtime":"react/jsx-dev-runtime","@/lib/trpc":"@/lib/trpc","@shared/const":"@shared/const","@tanstack/react-query":"@tanstack/react-query","@trpc/client":"@trpc/client","react-dom/client":"react-dom/client","superjson":"superjson","./App":"7r6q0","./const":"3oDGa","./index.css":"6NYJW","@parcel/transformer-js/src/esmodule-helpers.js":"ahW7q"}],"7r6q0":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
var _jsxDevRuntime = require("react/jsx-dev-runtime");
var _sonner = require("@/components/ui/sonner");
var _tooltip = require("@/components/ui/tooltip");
var _notFound = require("@/pages/NotFound");
var _notFoundDefault = parcelHelpers.interopDefault(_notFound);
var _wouter = require("wouter");
var _errorBoundary = require("./components/ErrorBoundary");
var _errorBoundaryDefault = parcelHelpers.interopDefault(_errorBoundary);
var _themeContext = require("./contexts/ThemeContext");
var _animatedBackground = require("./components/AnimatedBackground");
var _home = require("./pages/Home");
var _homeDefault = parcelHelpers.interopDefault(_home);
var _landing = require("./pages/Landing");
var _landingDefault = parcelHelpers.interopDefault(_landing);
var _showcase = require("./pages/Showcase");
var _showcaseDefault = parcelHelpers.interopDefault(_showcase);
function Router() {
    // make sure to consider if you need authentication for certain routes
    return /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _wouter.Switch), {
        children: [
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _wouter.Route), {
                path: "/",
                component: (0, _landingDefault.default)
            }, void 0, false, {
                fileName: "client/src/App.tsx",
                lineNumber: 16,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _wouter.Route), {
                path: "/app",
                component: (0, _homeDefault.default)
            }, void 0, false, {
                fileName: "client/src/App.tsx",
                lineNumber: 17,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _wouter.Route), {
                path: "/showcase",
                component: (0, _showcaseDefault.default)
            }, void 0, false, {
                fileName: "client/src/App.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _wouter.Route), {
                path: "/404",
                component: (0, _notFoundDefault.default)
            }, void 0, false, {
                fileName: "client/src/App.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _wouter.Route), {
                component: (0, _notFoundDefault.default)
            }, void 0, false, {
                fileName: "client/src/App.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "client/src/App.tsx",
        lineNumber: 15,
        columnNumber: 5
    }, this);
}
// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook
function App() {
    return /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _errorBoundaryDefault.default), {
        children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _themeContext.ThemeProvider), {
            defaultTheme: "dark",
            children: [
                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _animatedBackground.AnimatedBackground), {}, void 0, false, {
                    fileName: "client/src/App.tsx",
                    lineNumber: 38,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _tooltip.TooltipProvider), {
                    children: [
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _sonner.Toaster), {}, void 0, false, {
                            fileName: "client/src/App.tsx",
                            lineNumber: 40,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)(Router, {}, void 0, false, {
                            fileName: "client/src/App.tsx",
                            lineNumber: 41,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "client/src/App.tsx",
                    lineNumber: 39,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "client/src/App.tsx",
            lineNumber: 34,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "client/src/App.tsx",
        lineNumber: 33,
        columnNumber: 5
    }, this);
}
// Adicionar tratamento de erro global
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event)=>{
        console.error('Global error:', event.error);
    });
    window.addEventListener('unhandledrejection', (event)=>{
        console.error('Unhandled promise rejection:', event.reason);
    });
}
exports.default = App;

},{"react/jsx-dev-runtime":"react/jsx-dev-runtime","@/components/ui/sonner":"@/components/ui/sonner","@/components/ui/tooltip":"@/components/ui/tooltip","@/pages/NotFound":"@/pages/NotFound","wouter":"wouter","./components/ErrorBoundary":"2Zt4m","./contexts/ThemeContext":"2N5hP","./components/AnimatedBackground":"4rznG","./pages/Home":"iRyoZ","./pages/Landing":"ceTQo","./pages/Showcase":"7QUIE","@parcel/transformer-js/src/esmodule-helpers.js":"ahW7q"}],"2Zt4m":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
var _jsxDevRuntime = require("react/jsx-dev-runtime");
var _utils = require("@/lib/utils");
var _lucideReact = require("lucide-react");
var _react = require("react");
class ErrorBoundary extends (0, _react.Component) {
    constructor(props){
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }
    render() {
        if (this.state.hasError) return /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
            className: "flex items-center justify-center min-h-screen p-8 bg-background",
            children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                className: "flex flex-col items-center w-full max-w-2xl p-8",
                children: [
                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.AlertTriangle), {
                        size: 48,
                        className: "text-destructive mb-6 flex-shrink-0"
                    }, void 0, false, {
                        fileName: "client/src/components/ErrorBoundary.tsx",
                        lineNumber: 29,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h2", {
                        className: "text-xl mb-4",
                        children: "An unexpected error occurred."
                    }, void 0, false, {
                        fileName: "client/src/components/ErrorBoundary.tsx",
                        lineNumber: 34,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                        className: "p-4 w-full rounded bg-muted overflow-auto mb-6",
                        children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("pre", {
                            className: "text-sm text-muted-foreground whitespace-break-spaces",
                            children: this.state.error?.stack
                        }, void 0, false, {
                            fileName: "client/src/components/ErrorBoundary.tsx",
                            lineNumber: 37,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "client/src/components/ErrorBoundary.tsx",
                        lineNumber: 36,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("button", {
                        onClick: ()=>window.location.reload(),
                        className: (0, _utils.cn)("flex items-center gap-2 px-4 py-2 rounded-lg", "bg-primary text-primary-foreground", "hover:opacity-90 cursor-pointer"),
                        children: [
                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.RotateCcw), {
                                size: 16
                            }, void 0, false, {
                                fileName: "client/src/components/ErrorBoundary.tsx",
                                lineNumber: 50,
                                columnNumber: 15
                            }, this),
                            "Reload Page"
                        ]
                    }, void 0, true, {
                        fileName: "client/src/components/ErrorBoundary.tsx",
                        lineNumber: 42,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "client/src/components/ErrorBoundary.tsx",
                lineNumber: 28,
                columnNumber: 11
            }, this)
        }, void 0, false, {
            fileName: "client/src/components/ErrorBoundary.tsx",
            lineNumber: 27,
            columnNumber: 9
        }, this);
        return this.props.children;
    }
}
exports.default = ErrorBoundary;

},{"react/jsx-dev-runtime":"react/jsx-dev-runtime","@/lib/utils":"@/lib/utils","lucide-react":"lucide-react","react":"react","@parcel/transformer-js/src/esmodule-helpers.js":"ahW7q"}],"ahW7q":[function(require,module,exports,__globalThis) {
exports.interopDefault = function(a) {
    return a && a.__esModule ? a : {
        default: a
    };
};
exports.defineInteropFlag = function(a) {
    Object.defineProperty(a, '__esModule', {
        value: true
    });
};
exports.exportAll = function(source, dest) {
    Object.keys(source).forEach(function(key) {
        if (key === 'default' || key === '__esModule' || Object.prototype.hasOwnProperty.call(dest, key)) return;
        Object.defineProperty(dest, key, {
            enumerable: true,
            get: function() {
                return source[key];
            }
        });
    });
    return dest;
};
exports.export = function(dest, destName, get) {
    Object.defineProperty(dest, destName, {
        enumerable: true,
        get: get
    });
};

},{}],"2N5hP":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "ThemeProvider", ()=>ThemeProvider);
parcelHelpers.export(exports, "useTheme", ()=>useTheme);
var _jsxDevRuntime = require("react/jsx-dev-runtime");
var _react = require("react");
var _reactDefault = parcelHelpers.interopDefault(_react);
const ThemeContext = /*#__PURE__*/ (0, _react.createContext)(undefined);
function ThemeProvider({ children, defaultTheme = "light", switchable = false }) {
    const [theme, setTheme] = (0, _react.useState)(()=>{
        if (switchable) {
            const stored = localStorage.getItem("theme");
            return stored || defaultTheme;
        }
        return defaultTheme;
    });
    (0, _react.useEffect)(()=>{
        const root = document.documentElement;
        if (theme === "dark") root.classList.add("dark");
        else root.classList.remove("dark");
        if (switchable) localStorage.setItem("theme", theme);
    }, [
        theme,
        switchable
    ]);
    const toggleTheme = switchable ? ()=>{
        setTheme((prev)=>prev === "light" ? "dark" : "light");
    } : undefined;
    return /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)(ThemeContext.Provider, {
        value: {
            theme,
            toggleTheme,
            switchable
        },
        children: children
    }, void 0, false, {
        fileName: "client/src/contexts/ThemeContext.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
function useTheme() {
    const context = (0, _react.useContext)(ThemeContext);
    if (!context) throw new Error("useTheme must be used within ThemeProvider");
    return context;
}

},{"react/jsx-dev-runtime":"react/jsx-dev-runtime","react":"react","@parcel/transformer-js/src/esmodule-helpers.js":"ahW7q"}],"4rznG":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "AnimatedBackground", ()=>AnimatedBackground);
var _jsxDevRuntime = require("react/jsx-dev-runtime");
var _react = require("react");
function AnimatedBackground() {
    const canvasRef = (0, _react.useRef)(null);
    (0, _react.useEffect)(()=>{
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const particles = [];
        // Create particles
        for(let i = 0; i < 50; i++)particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2
        });
        let animationFrameId;
        const animate = ()=>{
            // Clear canvas - usar cor RGB compatível
            ctx.fillStyle = '#1a1a1a'; // Cor de fundo escura equivalente a oklch(0.15 0 0)
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Update and draw particles
            particles.forEach((particle, index)=>{
                particle.x += particle.vx;
                particle.y += particle.vy;
                // Bounce off walls
                if (particle.x - particle.radius < 0 || particle.x + particle.radius > canvas.width) particle.vx *= -1;
                if (particle.y - particle.radius < 0 || particle.y + particle.radius > canvas.height) particle.vy *= -1;
                // Keep particles in bounds
                particle.x = Math.max(particle.radius, Math.min(canvas.width - particle.radius, particle.x));
                particle.y = Math.max(particle.radius, Math.min(canvas.height - particle.radius, particle.y));
                // Draw particle - usar cor RGB compatível
                const r = 138; // Cor equivalente a oklch(0.6 0.2 280)
                const g = 43;
                const b = 226;
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particle.opacity})`;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
                // Draw connections to nearby particles
                for(let j = index + 1; j < particles.length; j++){
                    const other = particles[j];
                    const dx = other.x - particle.x;
                    const dy = other.y - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 150) {
                        const connectionOpacity = (1 - distance / 150) * 0.2;
                        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${connectionOpacity})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.stroke();
                    }
                }
            });
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();
        const handleResize = ()=>{
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        return ()=>{
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    return /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("canvas", {
        ref: canvasRef,
        className: "fixed inset-0 -z-10 pointer-events-none",
        style: {
            opacity: 0.3
        }
    }, void 0, false, {
        fileName: "client/src/components/AnimatedBackground.tsx",
        lineNumber: 108,
        columnNumber: 5
    }, this);
}

},{"react/jsx-dev-runtime":"react/jsx-dev-runtime","react":"react","@parcel/transformer-js/src/esmodule-helpers.js":"ahW7q"}],"iRyoZ":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "default", ()=>Home);
var _jsxDevRuntime = require("react/jsx-dev-runtime");
var _react = require("react");
var _lucideReact = require("lucide-react");
var _useAuth = require("@/_core/hooks/useAuth");
var _button = require("@/components/ui/button");
var _const = require("@/const");
var _sidebar = require("@/components/Sidebar");
var _advancedChatInterface = require("@/components/AdvancedChatInterface");
var _rightPanel = require("@/components/RightPanel");
var _agentTeamVisualization = require("@/components/AgentTeamVisualization");
var _useMobile = require("@/hooks/useMobile");
var _usePWA = require("@/hooks/usePWA");
var _useFullscreen = require("@/hooks/useFullscreen");
function Home() {
    const { user, loading, isAuthenticated, logout } = (0, _useAuth.useAuth)();
    const [sidebarOpen, setSidebarOpen] = (0, _react.useState)(false);
    const [rightPanelOpen, setRightPanelOpen] = (0, _react.useState)(false); // Fechado por padrão no mobile
    const isMobile = (0, _useMobile.useIsMobile)(); // Detecção automática de mobile
    const [newChatTrigger, setNewChatTrigger] = (0, _react.useState)(0); // Trigger para nova conversa
    // PWA e tela cheia
    const { isInstallable, isInstalled, install } = (0, _usePWA.usePWA)();
    const { isFullscreen, toggleFullscreen } = (0, _useFullscreen.useFullscreen)();
    // Permitir acesso sem autenticação (modo demo)
    // Se loading demorar muito, permitir acesso
    const [allowAccess, setAllowAccess] = (0, _react.useState)(false);
    (0, _react.useEffect)(()=>{
        // Se loading demorar mais de 3 segundos, permitir acesso
        const timer = setTimeout(()=>{
            setAllowAccess(true);
        }, 3000);
        return ()=>clearTimeout(timer);
    }, []);
    // Se não estiver autenticado mas permitir acesso, mostrar interface em modo demo
    if (!loading && !isAuthenticated && allowAccess) ;
    else if (loading && !allowAccess) return /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
        className: "min-h-screen bg-background flex items-center justify-center",
        children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
            className: "text-center space-y-4",
            children: [
                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                    className: "w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"
                }, void 0, false, {
                    fileName: "client/src/pages/Home.tsx",
                    lineNumber: 45,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                    className: "text-muted-foreground",
                    children: "Carregando..."
                }, void 0, false, {
                    fileName: "client/src/pages/Home.tsx",
                    lineNumber: 46,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "client/src/pages/Home.tsx",
            lineNumber: 44,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "client/src/pages/Home.tsx",
        lineNumber: 43,
        columnNumber: 7
    }, this);
    else if (!isAuthenticated && !allowAccess) return /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
        className: "min-h-screen bg-background flex items-center justify-center p-4",
        children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
            className: "max-w-md w-full space-y-8 text-center",
            children: [
                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                    className: "space-y-2",
                    children: [
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h1", {
                            className: "text-4xl font-bold text-foreground",
                            children: (0, _const.APP_TITLE)
                        }, void 0, false, {
                            fileName: "client/src/pages/Home.tsx",
                            lineNumber: 55,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                            className: "text-muted-foreground",
                            children: "Super Agente LLM com Autogen"
                        }, void 0, false, {
                            fileName: "client/src/pages/Home.tsx",
                            lineNumber: 56,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "client/src/pages/Home.tsx",
                    lineNumber: 54,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                    className: "space-y-4",
                    children: [
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                            className: "text-foreground",
                            children: "Uma interface inovadora para um super agente de IA que trabalha como uma equipe de desenvolvimento."
                        }, void 0, false, {
                            fileName: "client/src/pages/Home.tsx",
                            lineNumber: 59,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                            className: "space-y-2",
                            children: [
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _button.Button), {
                                    onClick: ()=>window.location.href = (0, _const.getLoginUrl)(),
                                    className: "w-full bg-primary hover:bg-primary/90 text-primary-foreground",
                                    children: "Entrar"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Home.tsx",
                                    lineNumber: 63,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _button.Button), {
                                    onClick: ()=>setAllowAccess(true),
                                    variant: "outline",
                                    className: "w-full",
                                    children: "Continuar sem autentica\xe7\xe3o (Demo)"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Home.tsx",
                                    lineNumber: 69,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "client/src/pages/Home.tsx",
                            lineNumber: 62,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "client/src/pages/Home.tsx",
                    lineNumber: 58,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "client/src/pages/Home.tsx",
            lineNumber: 53,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "client/src/pages/Home.tsx",
        lineNumber: 52,
        columnNumber: 7
    }, this);
    return /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
        className: "min-h-screen bg-background flex",
        children: [
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _sidebar.Sidebar), {
                isOpen: sidebarOpen,
                onToggle: ()=>setSidebarOpen(!sidebarOpen),
                onNewChat: ()=>{
                    setSidebarOpen(false);
                    setRightPanelOpen(false);
                    setNewChatTrigger((prev)=>prev + 1); // Trigger nova conversa
                }
            }, void 0, false, {
                fileName: "client/src/pages/Home.tsx",
                lineNumber: 85,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("main", {
                className: "flex-1 flex flex-col overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("header", {
                        className: `border-b border-border/50 ${isMobile ? 'p-3 bg-gradient-to-r from-card via-card/95 to-card backdrop-blur-xl shadow-sm sticky top-0 z-50' : 'p-4 bg-card'} flex items-center justify-between`,
                        children: [
                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                className: "flex items-center gap-2 sm:gap-4",
                                children: [
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _button.Button), {
                                        variant: "ghost",
                                        size: "icon",
                                        onClick: ()=>{
                                            setSidebarOpen(!sidebarOpen);
                                            if (!sidebarOpen) setRightPanelOpen(false); // Fechar right panel ao abrir sidebar
                                        },
                                        className: `lg:hidden ${isMobile ? 'h-12 w-12 rounded-full hover:bg-primary/10 active:scale-95 transition-all duration-200 min-w-[48px]' : ''}`,
                                        children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Menu), {
                                            className: `${isMobile ? 'w-7 h-7' : 'w-5 h-5'}`
                                        }, void 0, false, {
                                            fileName: "client/src/pages/Home.tsx",
                                            lineNumber: 107,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Home.tsx",
                                        lineNumber: 98,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                        children: [
                                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h2", {
                                                className: `${isMobile ? 'text-base font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent' : 'text-lg font-semibold'} text-foreground`,
                                                children: "AutoGen Super Agent"
                                            }, void 0, false, {
                                                fileName: "client/src/pages/Home.tsx",
                                                lineNumber: 110,
                                                columnNumber: 15
                                            }, this),
                                            !isMobile && /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                                className: "text-xs text-muted-foreground",
                                                children: "Equipe de Desenvolvimento IA"
                                            }, void 0, false, {
                                                fileName: "client/src/pages/Home.tsx",
                                                lineNumber: 112,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "client/src/pages/Home.tsx",
                                        lineNumber: 109,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "client/src/pages/Home.tsx",
                                lineNumber: 97,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    !isInstalled && isInstallable && /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _button.Button), {
                                        variant: "ghost",
                                        size: "icon",
                                        onClick: install,
                                        className: `${isMobile ? 'h-12 w-12 rounded-full hover:bg-primary/10 active:scale-95 transition-all duration-200 min-w-[48px]' : 'h-9 w-9'} text-primary hover:text-primary/80`,
                                        title: "Instalar app",
                                        children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Download), {
                                            className: `${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`
                                        }, void 0, false, {
                                            fileName: "client/src/pages/Home.tsx",
                                            lineNumber: 126,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Home.tsx",
                                        lineNumber: 119,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _button.Button), {
                                        variant: "ghost",
                                        size: "icon",
                                        onClick: toggleFullscreen,
                                        className: `${isMobile ? 'h-12 w-12 rounded-full hover:bg-primary/10 active:scale-95 transition-all duration-200 min-w-[48px]' : 'h-9 w-9'} text-muted-foreground hover:text-foreground`,
                                        title: isFullscreen ? "Sair de tela cheia" : "Tela cheia",
                                        children: isFullscreen ? /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Minimize), {
                                            className: `${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`
                                        }, void 0, false, {
                                            fileName: "client/src/pages/Home.tsx",
                                            lineNumber: 139,
                                            columnNumber: 17
                                        }, this) : /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Maximize), {
                                            className: `${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`
                                        }, void 0, false, {
                                            fileName: "client/src/pages/Home.tsx",
                                            lineNumber: 141,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Home.tsx",
                                        lineNumber: 131,
                                        columnNumber: 13
                                    }, this),
                                    isAuthenticated && user && /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _jsxDevRuntime.Fragment), {
                                        children: [
                                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("span", {
                                                className: "text-sm text-muted-foreground",
                                                children: user.name
                                            }, void 0, false, {
                                                fileName: "client/src/pages/Home.tsx",
                                                lineNumber: 147,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _button.Button), {
                                                variant: "ghost",
                                                size: "sm",
                                                onClick: logout,
                                                className: "text-muted-foreground hover:text-foreground",
                                                children: "Sair"
                                            }, void 0, false, {
                                                fileName: "client/src/pages/Home.tsx",
                                                lineNumber: 148,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true),
                                    !isAuthenticated && /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("span", {
                                        className: "text-sm text-muted-foreground",
                                        children: "Modo Demo"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Home.tsx",
                                        lineNumber: 159,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "client/src/pages/Home.tsx",
                                lineNumber: 116,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "client/src/pages/Home.tsx",
                        lineNumber: 96,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                        className: `flex-1 flex overflow-hidden ${isMobile ? 'gap-0 p-0' : 'gap-4 p-4'} relative`,
                        children: [
                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                className: `flex-1 flex flex-col min-w-0 ${isMobile && (sidebarOpen || rightPanelOpen) ? 'hidden' : ''}`,
                                children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                    className: `flex-1 ${isMobile ? 'bg-background shadow-inner' : 'bg-card rounded-lg border border-border'} overflow-hidden flex flex-col`,
                                    children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _advancedChatInterface.AdvancedChatInterface), {
                                        onNewChat: ()=>{
                                            setSidebarOpen(false);
                                            setRightPanelOpen(false);
                                        }
                                    }, newChatTrigger, false, {
                                        fileName: "client/src/pages/Home.tsx",
                                        lineNumber: 168,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "client/src/pages/Home.tsx",
                                    lineNumber: 167,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "client/src/pages/Home.tsx",
                                lineNumber: 166,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                className: `${isMobile ? rightPanelOpen ? 'block' : 'hidden' : 'hidden xl:flex'} w-80 flex-col`,
                                children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                    className: "flex-1 bg-card rounded-lg border border-border overflow-hidden p-4",
                                    children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _agentTeamVisualization.AgentTeamVisualization), {}, void 0, false, {
                                        fileName: "client/src/pages/Home.tsx",
                                        lineNumber: 181,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "client/src/pages/Home.tsx",
                                    lineNumber: 180,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "client/src/pages/Home.tsx",
                                lineNumber: 179,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                className: `${isMobile ? 'fixed inset-0 z-50' : 'hidden lg:flex'} w-80 flex-col`,
                                children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _rightPanel.RightPanel), {
                                    isOpen: rightPanelOpen,
                                    onToggle: ()=>setRightPanelOpen(!rightPanelOpen)
                                }, void 0, false, {
                                    fileName: "client/src/pages/Home.tsx",
                                    lineNumber: 187,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "client/src/pages/Home.tsx",
                                lineNumber: 186,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "client/src/pages/Home.tsx",
                        lineNumber: 164,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "client/src/pages/Home.tsx",
                lineNumber: 95,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "client/src/pages/Home.tsx",
        lineNumber: 84,
        columnNumber: 5
    }, this);
}

},{"react/jsx-dev-runtime":"react/jsx-dev-runtime","react":"react","lucide-react":"lucide-react","@/_core/hooks/useAuth":"@/_core/hooks/useAuth","@/components/ui/button":"@/components/ui/button","@/const":"@/const","@/components/Sidebar":"@/components/Sidebar","@/components/AdvancedChatInterface":"@/components/AdvancedChatInterface","@/components/RightPanel":"@/components/RightPanel","@/components/AgentTeamVisualization":"@/components/AgentTeamVisualization","@/hooks/useMobile":"@/hooks/useMobile","@/hooks/usePWA":"@/hooks/usePWA","@/hooks/useFullscreen":"@/hooks/useFullscreen","@parcel/transformer-js/src/esmodule-helpers.js":"ahW7q"}],"ceTQo":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "default", ()=>Landing);
var _jsxDevRuntime = require("react/jsx-dev-runtime");
var _heroSection = require("@/components/HeroSection");
var _glassCard = require("@/components/GlassCard");
var _3DagentCard = require("@/components/3DAgentCard");
var _button = require("@/components/ui/button");
var _wouter = require("wouter");
var _lucideReact = require("lucide-react");
var _framerMotion = require("framer-motion");
var _react = require("react");
function Landing() {
    const [deferredPrompt, setDeferredPrompt] = (0, _react.useState)(null);
    const [isInstallable, setIsInstallable] = (0, _react.useState)(false);
    (0, _react.useEffect)(()=>{
        // Detectar se o app pode ser instalado (PWA)
        const handler = (e)=>{
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return ()=>{
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);
    const handleInstallClick = async ()=>{
        if (!deferredPrompt) {
            // Se não houver prompt, mostrar instruções
            alert('Para instalar o app:\n\nAndroid: Toque no menu (\u22EE) > "Adicionar \xe0 tela inicial"\n\niOS: Toque no bot\xe3o Compartilhar > "Adicionar \xe0 Tela de In\xedcio"');
            return;
        }
        // Mostrar prompt de instalação
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setIsInstallable(false);
        setDeferredPrompt(null);
    };
    return /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
        className: "min-h-screen bg-background",
        children: [
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("nav", {
                className: "fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/50",
                children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                    className: "max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5 flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _framerMotion.motion).div, {
                            initial: {
                                opacity: 0,
                                x: -20
                            },
                            animate: {
                                opacity: 1,
                                x: 0
                            },
                            transition: {
                                duration: 0.5
                            },
                            className: "text-2xl font-semibold tracking-tight text-foreground",
                            style: {
                                fontFeatureSettings: '"liga" 1, "kern" 1'
                            },
                            children: "AutoGen"
                        }, void 0, false, {
                            fileName: "client/src/pages/Landing.tsx",
                            lineNumber: 52,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _framerMotion.motion).div, {
                            initial: {
                                opacity: 0,
                                x: 20
                            },
                            animate: {
                                opacity: 1,
                                x: 0
                            },
                            transition: {
                                duration: 0.5
                            },
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _wouter.Link), {
                                    href: "/showcase",
                                    children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _button.Button), {
                                        variant: "ghost",
                                        className: "text-foreground/70 hover:text-foreground hover:bg-card/50 rounded-xl px-5 py-2.5 font-medium transition-all duration-200",
                                        children: "Showcase"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Landing.tsx",
                                        lineNumber: 68,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 67,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _wouter.Link), {
                                    href: "/app",
                                    children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _button.Button), {
                                        className: "bg-foreground text-background hover:bg-foreground/90 rounded-xl px-6 py-2.5 font-medium transition-all duration-200 hover:scale-105",
                                        children: "Iniciar Chat"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Landing.tsx",
                                        lineNumber: 73,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 72,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "client/src/pages/Landing.tsx",
                            lineNumber: 61,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "client/src/pages/Landing.tsx",
                    lineNumber: 51,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "client/src/pages/Landing.tsx",
                lineNumber: 50,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _heroSection.HeroSection), {}, void 0, false, {
                fileName: "client/src/pages/Landing.tsx",
                lineNumber: 82,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("section", {
                className: "py-32 border-t border-border/30",
                children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                    className: "max-w-7xl mx-auto px-6 sm:px-8 lg:px-12",
                    children: [
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _framerMotion.motion).div, {
                            initial: {
                                opacity: 0,
                                y: 30
                            },
                            whileInView: {
                                opacity: 1,
                                y: 0
                            },
                            viewport: {
                                once: true
                            },
                            transition: {
                                duration: 0.8
                            },
                            className: "text-center space-y-5 mb-20",
                            children: [
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h2", {
                                    className: "text-5xl lg:text-6xl font-semibold text-foreground tracking-tight",
                                    style: {
                                        fontFeatureSettings: '"liga" 1, "kern" 1'
                                    },
                                    children: "Caracter\xedsticas Poderosas"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 94,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                    className: "text-xl lg:text-2xl text-foreground/60 max-w-2xl mx-auto font-light leading-relaxed",
                                    style: {
                                        letterSpacing: '-0.01em'
                                    },
                                    children: "Tudo que voc\xea precisa para gerenciar um super agente de IA com m\xfaltiplos modelos colaborativos"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 97,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "client/src/pages/Landing.tsx",
                            lineNumber: 87,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                            children: [
                                {
                                    icon: (0, _lucideReact.Brain),
                                    title: "M\xfaltiplos Agentes",
                                    description: 'Trabalhe com uma equipe de especialistas em IA, cada um com sua expertise'
                                },
                                {
                                    icon: (0, _lucideReact.Zap),
                                    title: "Execu\xe7\xe3o R\xe1pida",
                                    description: "Processamento paralelo e otimizado para m\xe1xima performance"
                                },
                                {
                                    icon: (0, _lucideReact.Code),
                                    title: "Gera\xe7\xe3o de C\xf3digo",
                                    description: "Gere c\xf3digo de qualidade produ\xe7\xe3o automaticamente"
                                },
                                {
                                    icon: (0, _lucideReact.Palette),
                                    title: 'Design Inteligente',
                                    description: 'Crie interfaces bonitas com ajuda de IA'
                                },
                                {
                                    icon: (0, _lucideReact.CheckCircle),
                                    title: 'Auto-Recompensa',
                                    description: "Sistema de aprendizado cont\xednuo e auto-otimiza\xe7\xe3o"
                                },
                                {
                                    icon: (0, _lucideReact.ArrowRight),
                                    title: "F\xe1cil Integra\xe7\xe3o",
                                    description: "Integre com seus sistemas existentes sem esfor\xe7o"
                                }
                            ].map((feature, index)=>/*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _framerMotion.motion).div, {
                                    initial: {
                                        opacity: 0,
                                        y: 20
                                    },
                                    whileInView: {
                                        opacity: 1,
                                        y: 0
                                    },
                                    viewport: {
                                        once: true
                                    },
                                    transition: {
                                        duration: 0.6,
                                        delay: index * 0.1
                                    },
                                    whileHover: {
                                        y: -5,
                                        scale: 1.02
                                    },
                                    children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _glassCard.GlassCard), {
                                        className: "p-8 space-y-5 hover:border-primary/50 transition-all duration-300 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50",
                                        children: [
                                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                className: "w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-all",
                                                children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)(feature.icon, {
                                                    className: "w-7 h-7 text-primary"
                                                }, void 0, false, {
                                                    fileName: "client/src/pages/Landing.tsx",
                                                    lineNumber: 145,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "client/src/pages/Landing.tsx",
                                                lineNumber: 144,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h3", {
                                                        className: "text-xl font-semibold text-foreground mb-3 tracking-tight",
                                                        children: feature.title
                                                    }, void 0, false, {
                                                        fileName: "client/src/pages/Landing.tsx",
                                                        lineNumber: 148,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                                        className: "text-sm text-foreground/60 leading-relaxed",
                                                        children: feature.description
                                                    }, void 0, false, {
                                                        fileName: "client/src/pages/Landing.tsx",
                                                        lineNumber: 149,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "client/src/pages/Landing.tsx",
                                                lineNumber: 147,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "client/src/pages/Landing.tsx",
                                        lineNumber: 143,
                                        columnNumber: 17
                                    }, this)
                                }, index, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 135,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "client/src/pages/Landing.tsx",
                            lineNumber: 102,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "client/src/pages/Landing.tsx",
                    lineNumber: 86,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "client/src/pages/Landing.tsx",
                lineNumber: 85,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("section", {
                className: "py-20 border-t border-border",
                children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
                    children: [
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                            className: "text-center space-y-4 mb-16",
                            children: [
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h2", {
                                    className: "text-4xl lg:text-5xl font-bold text-foreground",
                                    children: "Sua Equipe de Agentes"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 162,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                    className: "text-xl text-muted-foreground max-w-2xl mx-auto",
                                    children: "Conhe\xe7a os especialistas que trabalham para voc\xea"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 165,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "client/src/pages/Landing.tsx",
                            lineNumber: 161,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
                            children: [
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _3DagentCard.Agent3DCard), {
                                    icon: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Brain), {
                                        className: "w-6 h-6"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Landing.tsx",
                                        lineNumber: 172,
                                        columnNumber: 21
                                    }, void 0),
                                    name: "Architect",
                                    role: "System Design",
                                    color: "oklch(0.6 0.2 280)",
                                    status: "idle"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 171,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _3DagentCard.Agent3DCard), {
                                    icon: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Code), {
                                        className: "w-6 h-6"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Landing.tsx",
                                        lineNumber: 179,
                                        columnNumber: 21
                                    }, void 0),
                                    name: "Developer",
                                    role: "Code Generation",
                                    color: "oklch(0.6 0.2 150)",
                                    status: "active"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 178,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _3DagentCard.Agent3DCard), {
                                    icon: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Palette), {
                                        className: "w-6 h-6"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Landing.tsx",
                                        lineNumber: 186,
                                        columnNumber: 21
                                    }, void 0),
                                    name: "Designer",
                                    role: "UI/UX",
                                    color: "oklch(0.6 0.2 50)",
                                    status: "thinking"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 185,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _3DagentCard.Agent3DCard), {
                                    icon: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Zap), {
                                        className: "w-6 h-6"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Landing.tsx",
                                        lineNumber: 193,
                                        columnNumber: 21
                                    }, void 0),
                                    name: "Executor",
                                    role: "Task Execution",
                                    color: "oklch(0.6 0.2 200)",
                                    status: "idle"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 192,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "client/src/pages/Landing.tsx",
                            lineNumber: 170,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "client/src/pages/Landing.tsx",
                    lineNumber: 160,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "client/src/pages/Landing.tsx",
                lineNumber: 159,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("section", {
                className: "py-20 sm:py-32 border-t border-border/30 bg-gradient-to-b from-background to-card/30",
                children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _framerMotion.motion).div, {
                    initial: {
                        opacity: 0,
                        y: 30
                    },
                    whileInView: {
                        opacity: 1,
                        y: 0
                    },
                    viewport: {
                        once: true
                    },
                    transition: {
                        duration: 0.8
                    },
                    className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-12",
                    children: [
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                            className: "text-center space-y-6 mb-12",
                            children: [
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h2", {
                                    className: "text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight",
                                    style: {
                                        fontFeatureSettings: '"liga" 1, "kern" 1'
                                    },
                                    children: "Adicione \xe0 Tela Inicial"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 213,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                    className: "text-lg sm:text-xl lg:text-2xl text-foreground/60 font-light leading-relaxed max-w-2xl mx-auto",
                                    style: {
                                        letterSpacing: '-0.01em'
                                    },
                                    children: "Use AutoGen como um app nativo. Adicione \xe0 tela inicial do seu celular para acesso r\xe1pido"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 216,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "client/src/pages/Landing.tsx",
                            lineNumber: 212,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                            className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8",
                            children: [
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _framerMotion.motion).div, {
                                    initial: {
                                        opacity: 0,
                                        x: -20
                                    },
                                    whileInView: {
                                        opacity: 1,
                                        x: 0
                                    },
                                    viewport: {
                                        once: true
                                    },
                                    transition: {
                                        duration: 0.6
                                    },
                                    className: "bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 sm:p-8",
                                    children: [
                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                            className: "flex items-center gap-4 mb-4",
                                            children: [
                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                    className: "w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center",
                                                    children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Smartphone), {
                                                        className: "w-6 h-6 text-primary"
                                                    }, void 0, false, {
                                                        fileName: "client/src/pages/Landing.tsx",
                                                        lineNumber: 232,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "client/src/pages/Landing.tsx",
                                                    lineNumber: 231,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h3", {
                                                            className: "text-xl font-semibold text-foreground",
                                                            children: "Android"
                                                        }, void 0, false, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 235,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                                            className: "text-sm text-foreground/60",
                                                            children: "Chrome / Edge"
                                                        }, void 0, false, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 236,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "client/src/pages/Landing.tsx",
                                                    lineNumber: 234,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "client/src/pages/Landing.tsx",
                                            lineNumber: 230,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                            className: "space-y-4 mb-6",
                                            children: [
                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                    className: "flex items-start gap-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                            className: "w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5",
                                                            children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("span", {
                                                                className: "text-xs font-semibold text-primary",
                                                                children: "1"
                                                            }, void 0, false, {
                                                                fileName: "client/src/pages/Landing.tsx",
                                                                lineNumber: 243,
                                                                columnNumber: 21
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 242,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                                            className: "text-sm text-foreground/70 leading-relaxed",
                                                            children: [
                                                                "Toque no menu ",
                                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("strong", {
                                                                    className: "text-foreground",
                                                                    children: "\u22EE"
                                                                }, void 0, false, {
                                                                    fileName: "client/src/pages/Landing.tsx",
                                                                    lineNumber: 246,
                                                                    columnNumber: 35
                                                                }, this),
                                                                " (tr\xeas pontos) no canto superior direito"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 245,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "client/src/pages/Landing.tsx",
                                                    lineNumber: 241,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                    className: "flex items-start gap-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                            className: "w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5",
                                                            children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("span", {
                                                                className: "text-xs font-semibold text-primary",
                                                                children: "2"
                                                            }, void 0, false, {
                                                                fileName: "client/src/pages/Landing.tsx",
                                                                lineNumber: 251,
                                                                columnNumber: 21
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 250,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                                            className: "text-sm text-foreground/70 leading-relaxed",
                                                            children: [
                                                                "Selecione ",
                                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("strong", {
                                                                    className: "text-foreground",
                                                                    children: '"Adicionar \xe0 tela inicial"'
                                                                }, void 0, false, {
                                                                    fileName: "client/src/pages/Landing.tsx",
                                                                    lineNumber: 254,
                                                                    columnNumber: 31
                                                                }, this),
                                                                " ou ",
                                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("strong", {
                                                                    className: "text-foreground",
                                                                    children: '"Instalar app"'
                                                                }, void 0, false, {
                                                                    fileName: "client/src/pages/Landing.tsx",
                                                                    lineNumber: 254,
                                                                    columnNumber: 106
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 253,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "client/src/pages/Landing.tsx",
                                                    lineNumber: 249,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                    className: "flex items-start gap-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                            className: "w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5",
                                                            children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("span", {
                                                                className: "text-xs font-semibold text-primary",
                                                                children: "3"
                                                            }, void 0, false, {
                                                                fileName: "client/src/pages/Landing.tsx",
                                                                lineNumber: 259,
                                                                columnNumber: 21
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 258,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                                            className: "text-sm text-foreground/70 leading-relaxed",
                                                            children: "Confirme e o app ser\xe1 adicionado \xe0 sua tela inicial"
                                                        }, void 0, false, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 261,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "client/src/pages/Landing.tsx",
                                                    lineNumber: 257,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "client/src/pages/Landing.tsx",
                                            lineNumber: 240,
                                            columnNumber: 15
                                        }, this),
                                        isInstallable ? /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _button.Button), {
                                            onClick: handleInstallClick,
                                            size: "lg",
                                            className: "w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium transition-all duration-300 hover:scale-105",
                                            children: [
                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Download), {
                                                    className: "w-5 h-5 mr-2"
                                                }, void 0, false, {
                                                    fileName: "client/src/pages/Landing.tsx",
                                                    lineNumber: 273,
                                                    columnNumber: 19
                                                }, this),
                                                "Instalar Agora"
                                            ]
                                        }, void 0, true, {
                                            fileName: "client/src/pages/Landing.tsx",
                                            lineNumber: 268,
                                            columnNumber: 17
                                        }, this) : /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _button.Button), {
                                            onClick: handleInstallClick,
                                            size: "lg",
                                            variant: "outline",
                                            className: "w-full rounded-xl font-medium transition-all duration-300 hover:scale-105",
                                            children: [
                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Plus), {
                                                    className: "w-5 h-5 mr-2"
                                                }, void 0, false, {
                                                    fileName: "client/src/pages/Landing.tsx",
                                                    lineNumber: 283,
                                                    columnNumber: 19
                                                }, this),
                                                "Adicionar \xe0 Tela Inicial"
                                            ]
                                        }, void 0, true, {
                                            fileName: "client/src/pages/Landing.tsx",
                                            lineNumber: 277,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 223,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _framerMotion.motion).div, {
                                    initial: {
                                        opacity: 0,
                                        x: 20
                                    },
                                    whileInView: {
                                        opacity: 1,
                                        x: 0
                                    },
                                    viewport: {
                                        once: true
                                    },
                                    transition: {
                                        duration: 0.6
                                    },
                                    className: "bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 sm:p-8",
                                    children: [
                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                            className: "flex items-center gap-4 mb-4",
                                            children: [
                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                    className: "w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center",
                                                    children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Smartphone), {
                                                        className: "w-6 h-6 text-primary"
                                                    }, void 0, false, {
                                                        fileName: "client/src/pages/Landing.tsx",
                                                        lineNumber: 299,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "client/src/pages/Landing.tsx",
                                                    lineNumber: 298,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h3", {
                                                            className: "text-xl font-semibold text-foreground",
                                                            children: "iOS (iPhone/iPad)"
                                                        }, void 0, false, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 302,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                                            className: "text-sm text-foreground/60",
                                                            children: "Safari"
                                                        }, void 0, false, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 303,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "client/src/pages/Landing.tsx",
                                                    lineNumber: 301,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "client/src/pages/Landing.tsx",
                                            lineNumber: 297,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                            className: "space-y-4 mb-6",
                                            children: [
                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                    className: "flex items-start gap-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                            className: "w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5",
                                                            children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("span", {
                                                                className: "text-xs font-semibold text-primary",
                                                                children: "1"
                                                            }, void 0, false, {
                                                                fileName: "client/src/pages/Landing.tsx",
                                                                lineNumber: 310,
                                                                columnNumber: 21
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 309,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                                            className: "text-sm text-foreground/70 leading-relaxed",
                                                            children: [
                                                                "Toque no bot\xe3o ",
                                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("strong", {
                                                                    className: "text-foreground",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Share2), {
                                                                            className: "w-4 h-4 inline"
                                                                        }, void 0, false, {
                                                                            fileName: "client/src/pages/Landing.tsx",
                                                                            lineNumber: 313,
                                                                            columnNumber: 72
                                                                        }, this),
                                                                        " Compartilhar"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "client/src/pages/Landing.tsx",
                                                                    lineNumber: 313,
                                                                    columnNumber: 36
                                                                }, this),
                                                                " na parte inferior da tela"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 312,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "client/src/pages/Landing.tsx",
                                                    lineNumber: 308,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                    className: "flex items-start gap-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                            className: "w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5",
                                                            children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("span", {
                                                                className: "text-xs font-semibold text-primary",
                                                                children: "2"
                                                            }, void 0, false, {
                                                                fileName: "client/src/pages/Landing.tsx",
                                                                lineNumber: 318,
                                                                columnNumber: 21
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 317,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                                            className: "text-sm text-foreground/70 leading-relaxed",
                                                            children: [
                                                                "Role para baixo e selecione ",
                                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("strong", {
                                                                    className: "text-foreground",
                                                                    children: '"Adicionar \xe0 Tela de In\xedcio"'
                                                                }, void 0, false, {
                                                                    fileName: "client/src/pages/Landing.tsx",
                                                                    lineNumber: 321,
                                                                    columnNumber: 49
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 320,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "client/src/pages/Landing.tsx",
                                                    lineNumber: 316,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                    className: "flex items-start gap-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                            className: "w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5",
                                                            children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("span", {
                                                                className: "text-xs font-semibold text-primary",
                                                                children: "3"
                                                            }, void 0, false, {
                                                                fileName: "client/src/pages/Landing.tsx",
                                                                lineNumber: 326,
                                                                columnNumber: 21
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 325,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                                            className: "text-sm text-foreground/70 leading-relaxed",
                                                            children: [
                                                                "Toque em ",
                                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("strong", {
                                                                    className: "text-foreground",
                                                                    children: '"Adicionar"'
                                                                }, void 0, false, {
                                                                    fileName: "client/src/pages/Landing.tsx",
                                                                    lineNumber: 329,
                                                                    columnNumber: 30
                                                                }, this),
                                                                " no canto superior direito"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "client/src/pages/Landing.tsx",
                                                            lineNumber: 328,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "client/src/pages/Landing.tsx",
                                                    lineNumber: 324,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "client/src/pages/Landing.tsx",
                                            lineNumber: 307,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _button.Button), {
                                            onClick: ()=>{
                                                if (navigator.share) navigator.share({
                                                    title: 'AutoGen Super Agent',
                                                    text: "Adicione AutoGen \xe0 sua tela inicial",
                                                    url: window.location.href
                                                });
                                                else alert("Use o bot\xe3o Compartilhar do Safari para adicionar \xe0 tela inicial");
                                            },
                                            size: "lg",
                                            variant: "outline",
                                            className: "w-full rounded-xl font-medium transition-all duration-300 hover:scale-105",
                                            children: [
                                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Share2), {
                                                    className: "w-5 h-5 mr-2"
                                                }, void 0, false, {
                                                    fileName: "client/src/pages/Landing.tsx",
                                                    lineNumber: 350,
                                                    columnNumber: 17
                                                }, this),
                                                "Compartilhar e Adicionar"
                                            ]
                                        }, void 0, true, {
                                            fileName: "client/src/pages/Landing.tsx",
                                            lineNumber: 334,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 290,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "client/src/pages/Landing.tsx",
                            lineNumber: 221,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _framerMotion.motion).div, {
                            initial: {
                                opacity: 0,
                                y: 20
                            },
                            whileInView: {
                                opacity: 1,
                                y: 0
                            },
                            viewport: {
                                once: true
                            },
                            transition: {
                                duration: 0.6,
                                delay: 0.2
                            },
                            className: "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8 text-center",
                            children: [
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h3", {
                                    className: "text-xl sm:text-2xl font-semibold text-foreground mb-3",
                                    children: "\u2728 Acesso R\xe1pido e Offline"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 364,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                    className: "text-foreground/70 mb-4 leading-relaxed max-w-2xl mx-auto",
                                    children: "Ap\xf3s adicionar \xe0 tela inicial, voc\xea ter\xe1 acesso r\xe1pido ao AutoGen, mesmo sem internet. O app funciona como um aplicativo nativo com todas as funcionalidades."
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 367,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                    className: "flex flex-wrap justify-center gap-3 text-sm text-foreground/60",
                                    children: [
                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("span", {
                                            className: "px-3 py-1 bg-card/50 rounded-full",
                                            children: "\u26A1 Acesso R\xe1pido"
                                        }, void 0, false, {
                                            fileName: "client/src/pages/Landing.tsx",
                                            lineNumber: 372,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("span", {
                                            className: "px-3 py-1 bg-card/50 rounded-full",
                                            children: "\uD83D\uDCF1 App Nativo"
                                        }, void 0, false, {
                                            fileName: "client/src/pages/Landing.tsx",
                                            lineNumber: 373,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("span", {
                                            className: "px-3 py-1 bg-card/50 rounded-full",
                                            children: "\uD83C\uDF10 Funciona Offline"
                                        }, void 0, false, {
                                            fileName: "client/src/pages/Landing.tsx",
                                            lineNumber: 374,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("span", {
                                            className: "px-3 py-1 bg-card/50 rounded-full",
                                            children: "\uD83D\uDD04 Sincroniza\xe7\xe3o Autom\xe1tica"
                                        }, void 0, false, {
                                            fileName: "client/src/pages/Landing.tsx",
                                            lineNumber: 375,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 371,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "client/src/pages/Landing.tsx",
                            lineNumber: 357,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "client/src/pages/Landing.tsx",
                    lineNumber: 205,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "client/src/pages/Landing.tsx",
                lineNumber: 204,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("section", {
                className: "py-20 sm:py-32 border-t border-border/30",
                children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _framerMotion.motion).div, {
                    initial: {
                        opacity: 0,
                        y: 30
                    },
                    whileInView: {
                        opacity: 1,
                        y: 0
                    },
                    viewport: {
                        once: true
                    },
                    transition: {
                        duration: 0.8
                    },
                    className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center space-y-8 sm:space-y-10",
                    children: [
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                            className: "space-y-4 sm:space-y-6",
                            children: [
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h2", {
                                    className: "text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-foreground tracking-tight",
                                    style: {
                                        fontFeatureSettings: '"liga" 1, "kern" 1'
                                    },
                                    children: "Pronto para revolucionar seu workflow?"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 391,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                    className: "text-lg sm:text-xl lg:text-2xl text-foreground/60 font-light leading-relaxed",
                                    style: {
                                        letterSpacing: '-0.01em'
                                    },
                                    children: "Junte-se a milhares de usu\xe1rios que j\xe1 est\xe3o usando AutoGen para aumentar sua produtividade"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 394,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "client/src/pages/Landing.tsx",
                            lineNumber: 390,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                            className: "flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 pt-4",
                            children: [
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _wouter.Link), {
                                    href: "/app",
                                    children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _button.Button), {
                                        size: "lg",
                                        className: "w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg rounded-2xl font-medium group transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-foreground/20",
                                        children: [
                                            "Come\xe7ar Agora",
                                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.ArrowRight), {
                                                className: "w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300"
                                            }, void 0, false, {
                                                fileName: "client/src/pages/Landing.tsx",
                                                lineNumber: 403,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "client/src/pages/Landing.tsx",
                                        lineNumber: 401,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 400,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _wouter.Link), {
                                    href: "/showcase",
                                    children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _button.Button), {
                                        size: "lg",
                                        variant: "outline",
                                        className: "w-full sm:w-auto px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg rounded-2xl border-2 border-border/50 hover:border-border hover:bg-card/50 backdrop-blur-sm font-medium transition-all duration-300 hover:scale-105",
                                        children: "Ver Demonstra\xe7\xe3o"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Landing.tsx",
                                        lineNumber: 407,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "client/src/pages/Landing.tsx",
                                    lineNumber: 406,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "client/src/pages/Landing.tsx",
                            lineNumber: 399,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "client/src/pages/Landing.tsx",
                    lineNumber: 383,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "client/src/pages/Landing.tsx",
                lineNumber: 382,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("footer", {
                className: "border-t border-border py-12 bg-card/50",
                children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground",
                    children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                        children: "\xa9 2025 AutoGen Super Agent Interface. Powered by Autogen Framework."
                    }, void 0, false, {
                        fileName: "client/src/pages/Landing.tsx",
                        lineNumber: 422,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "client/src/pages/Landing.tsx",
                    lineNumber: 421,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "client/src/pages/Landing.tsx",
                lineNumber: 420,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "client/src/pages/Landing.tsx",
        lineNumber: 48,
        columnNumber: 5
    }, this);
}

},{"react/jsx-dev-runtime":"react/jsx-dev-runtime","@/components/HeroSection":"@/components/HeroSection","@/components/GlassCard":"@/components/GlassCard","@/components/3DAgentCard":"@/components/3DAgentCard","@/components/ui/button":"@/components/ui/button","wouter":"wouter","lucide-react":"lucide-react","framer-motion":"framer-motion","react":"react","@parcel/transformer-js/src/esmodule-helpers.js":"ahW7q"}],"7QUIE":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "default", ()=>Showcase);
var _jsxDevRuntime = require("react/jsx-dev-runtime");
var _lucideReact = require("lucide-react");
var _3DagentCard = require("@/components/3DAgentCard");
var _floatingOrb = require("@/components/FloatingOrb");
var _glassCard = require("@/components/GlassCard");
var _button = require("@/components/ui/button");
var _wouter = require("wouter");
function Showcase() {
    return /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
        className: "min-h-screen bg-background",
        children: [
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("header", {
                className: "border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40",
                children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                    className: "max-w-7xl mx-auto px-4 py-4 flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h1", {
                            className: "text-2xl font-bold text-foreground",
                            children: "AutoGen Showcase"
                        }, void 0, false, {
                            fileName: "client/src/pages/Showcase.tsx",
                            lineNumber: 14,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _wouter.Link), {
                            href: "/",
                            children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _button.Button), {
                                variant: "outline",
                                children: "Voltar"
                            }, void 0, false, {
                                fileName: "client/src/pages/Showcase.tsx",
                                lineNumber: 16,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "client/src/pages/Showcase.tsx",
                            lineNumber: 15,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "client/src/pages/Showcase.tsx",
                    lineNumber: 13,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "client/src/pages/Showcase.tsx",
                lineNumber: 12,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("main", {
                className: "max-w-7xl mx-auto px-4 py-12 space-y-16",
                children: [
                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("section", {
                        className: "space-y-6",
                        children: [
                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                children: [
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h2", {
                                        className: "text-3xl font-bold text-foreground mb-2",
                                        children: "Anima\xe7\xe3o Orbital 3D"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 26,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                        className: "text-muted-foreground",
                                        children: "Visualiza\xe7\xe3o din\xe2mica com part\xedculas orbitando"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 27,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "client/src/pages/Showcase.tsx",
                                lineNumber: 25,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _glassCard.GlassCard), {
                                className: "p-8 flex justify-center",
                                children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _floatingOrb.FloatingOrb), {}, void 0, false, {
                                    fileName: "client/src/pages/Showcase.tsx",
                                    lineNumber: 30,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "client/src/pages/Showcase.tsx",
                                lineNumber: 29,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "client/src/pages/Showcase.tsx",
                        lineNumber: 24,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("section", {
                        className: "space-y-6",
                        children: [
                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                children: [
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h2", {
                                        className: "text-3xl font-bold text-foreground mb-2",
                                        children: "Cart\xf5es de Agentes 3D"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 37,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                        className: "text-muted-foreground",
                                        children: "Intera\xe7\xe3o com efeito de perspectiva 3D"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 38,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "client/src/pages/Showcase.tsx",
                                lineNumber: 36,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
                                children: [
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _3DagentCard.Agent3DCard), {
                                        icon: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Brain), {
                                            className: "w-6 h-6"
                                        }, void 0, false, {
                                            fileName: "client/src/pages/Showcase.tsx",
                                            lineNumber: 42,
                                            columnNumber: 21
                                        }, void 0),
                                        name: "Architect",
                                        role: "System Design",
                                        color: "oklch(0.6 0.2 280)",
                                        status: "idle"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 41,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _3DagentCard.Agent3DCard), {
                                        icon: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Code), {
                                            className: "w-6 h-6"
                                        }, void 0, false, {
                                            fileName: "client/src/pages/Showcase.tsx",
                                            lineNumber: 49,
                                            columnNumber: 21
                                        }, void 0),
                                        name: "Developer",
                                        role: "Code Generation",
                                        color: "oklch(0.6 0.2 150)",
                                        status: "active"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 48,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _3DagentCard.Agent3DCard), {
                                        icon: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Palette), {
                                            className: "w-6 h-6"
                                        }, void 0, false, {
                                            fileName: "client/src/pages/Showcase.tsx",
                                            lineNumber: 56,
                                            columnNumber: 21
                                        }, void 0),
                                        name: "Designer",
                                        role: "UI/UX",
                                        color: "oklch(0.6 0.2 50)",
                                        status: "thinking"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 55,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _3DagentCard.Agent3DCard), {
                                        icon: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Zap), {
                                            className: "w-6 h-6"
                                        }, void 0, false, {
                                            fileName: "client/src/pages/Showcase.tsx",
                                            lineNumber: 63,
                                            columnNumber: 21
                                        }, void 0),
                                        name: "Executor",
                                        role: "Task Execution",
                                        color: "oklch(0.6 0.2 200)",
                                        status: "idle"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 62,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "client/src/pages/Showcase.tsx",
                                lineNumber: 40,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "client/src/pages/Showcase.tsx",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("section", {
                        className: "space-y-6",
                        children: [
                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                children: [
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h2", {
                                        className: "text-3xl font-bold text-foreground mb-2",
                                        children: "Cart\xf5es com Glassmorphism"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 75,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                        className: "text-muted-foreground",
                                        children: "Efeito de vidro com blur e transpar\xeancia"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 76,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "client/src/pages/Showcase.tsx",
                                lineNumber: 74,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                className: "grid grid-cols-1 md:grid-cols-3 gap-4",
                                children: [
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _glassCard.GlassCard), {
                                        className: "p-6 space-y-4",
                                        children: [
                                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                className: "w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center",
                                                children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Brain), {
                                                    className: "w-6 h-6 text-white"
                                                }, void 0, false, {
                                                    fileName: "client/src/pages/Showcase.tsx",
                                                    lineNumber: 81,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "client/src/pages/Showcase.tsx",
                                                lineNumber: 80,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h3", {
                                                        className: "text-lg font-semibold text-foreground",
                                                        children: "Intelig\xeancia"
                                                    }, void 0, false, {
                                                        fileName: "client/src/pages/Showcase.tsx",
                                                        lineNumber: 84,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                                        className: "text-sm text-muted-foreground",
                                                        children: "M\xfaltiplos modelos LLM trabalhando em equipe"
                                                    }, void 0, false, {
                                                        fileName: "client/src/pages/Showcase.tsx",
                                                        lineNumber: 85,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "client/src/pages/Showcase.tsx",
                                                lineNumber: 83,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 79,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _glassCard.GlassCard), {
                                        className: "p-6 space-y-4",
                                        children: [
                                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                className: "w-12 h-12 rounded-lg bg-gradient-to-br from-secondary to-primary flex items-center justify-center",
                                                children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Zap), {
                                                    className: "w-6 h-6 text-white"
                                                }, void 0, false, {
                                                    fileName: "client/src/pages/Showcase.tsx",
                                                    lineNumber: 90,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "client/src/pages/Showcase.tsx",
                                                lineNumber: 89,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h3", {
                                                        className: "text-lg font-semibold text-foreground",
                                                        children: "Performance"
                                                    }, void 0, false, {
                                                        fileName: "client/src/pages/Showcase.tsx",
                                                        lineNumber: 93,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                                        className: "text-sm text-muted-foreground",
                                                        children: "Execu\xe7\xe3o paralela e otimizada"
                                                    }, void 0, false, {
                                                        fileName: "client/src/pages/Showcase.tsx",
                                                        lineNumber: 94,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "client/src/pages/Showcase.tsx",
                                                lineNumber: 92,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 88,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _glassCard.GlassCard), {
                                        className: "p-6 space-y-4",
                                        children: [
                                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                className: "w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center",
                                                children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _lucideReact.Code), {
                                                    className: "w-6 h-6 text-white"
                                                }, void 0, false, {
                                                    fileName: "client/src/pages/Showcase.tsx",
                                                    lineNumber: 99,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "client/src/pages/Showcase.tsx",
                                                lineNumber: 98,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h3", {
                                                        className: "text-lg font-semibold text-foreground",
                                                        children: "Inova\xe7\xe3o"
                                                    }, void 0, false, {
                                                        fileName: "client/src/pages/Showcase.tsx",
                                                        lineNumber: 102,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                                        className: "text-sm text-muted-foreground",
                                                        children: "Interface moderna e intuitiva"
                                                    }, void 0, false, {
                                                        fileName: "client/src/pages/Showcase.tsx",
                                                        lineNumber: 103,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "client/src/pages/Showcase.tsx",
                                                lineNumber: 101,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 97,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "client/src/pages/Showcase.tsx",
                                lineNumber: 78,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "client/src/pages/Showcase.tsx",
                        lineNumber: 73,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("section", {
                        className: "space-y-6",
                        children: [
                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                children: [
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h2", {
                                        className: "text-3xl font-bold text-foreground mb-2",
                                        children: "Caracter\xedsticas Principais"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 112,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                        className: "text-muted-foreground",
                                        children: "Tudo que voc\xea precisa para gerenciar seu super agente IA"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 113,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "client/src/pages/Showcase.tsx",
                                lineNumber: 111,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                                className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                                children: [
                                    {
                                        title: 'Chat em Tempo Real',
                                        description: 'Comunique-se com seu super agente de forma natural e intuitiva'
                                    },
                                    {
                                        title: "Visualiza\xe7\xe3o de Agentes",
                                        description: 'Veja sua equipe de IA trabalhando em tempo real'
                                    },
                                    {
                                        title: 'Monitoramento de Tarefas',
                                        description: "Acompanhe o progresso de cada tarefa em execu\xe7\xe3o"
                                    },
                                    {
                                        title: "Hist\xf3rico de Resultados",
                                        description: 'Acesse todos os resultados anteriores facilmente'
                                    },
                                    {
                                        title: 'Interface Responsiva',
                                        description: 'Funciona perfeitamente em qualquer dispositivo'
                                    },
                                    {
                                        title: 'Design Inovador',
                                        description: 'Inspirado no design premium da Apple'
                                    }
                                ].map((feature, index)=>/*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _glassCard.GlassCard), {
                                        className: "p-4",
                                        children: [
                                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h3", {
                                                className: "font-semibold text-foreground mb-2",
                                                children: feature.title
                                            }, void 0, false, {
                                                fileName: "client/src/pages/Showcase.tsx",
                                                lineNumber: 143,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                                className: "text-sm text-muted-foreground",
                                                children: feature.description
                                            }, void 0, false, {
                                                fileName: "client/src/pages/Showcase.tsx",
                                                lineNumber: 144,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, index, true, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 142,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "client/src/pages/Showcase.tsx",
                                lineNumber: 115,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "client/src/pages/Showcase.tsx",
                        lineNumber: 110,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("section", {
                        className: "space-y-6 py-12",
                        children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
                            className: "text-center space-y-4",
                            children: [
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("h2", {
                                    className: "text-3xl font-bold text-foreground",
                                    children: "Pronto para come\xe7ar?"
                                }, void 0, false, {
                                    fileName: "client/src/pages/Showcase.tsx",
                                    lineNumber: 153,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("p", {
                                    className: "text-muted-foreground max-w-2xl mx-auto",
                                    children: "Experimente o poder do super agente IA com Autogen. Uma interface inovadora para gerenciar m\xfaltiplos modelos trabalhando em equipe."
                                }, void 0, false, {
                                    fileName: "client/src/pages/Showcase.tsx",
                                    lineNumber: 154,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _wouter.Link), {
                                    href: "/",
                                    children: /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)((0, _button.Button), {
                                        className: "bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2 text-lg",
                                        children: "Ir para a Interface Principal"
                                    }, void 0, false, {
                                        fileName: "client/src/pages/Showcase.tsx",
                                        lineNumber: 158,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "client/src/pages/Showcase.tsx",
                                    lineNumber: 157,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "client/src/pages/Showcase.tsx",
                            lineNumber: 152,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "client/src/pages/Showcase.tsx",
                        lineNumber: 151,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "client/src/pages/Showcase.tsx",
                lineNumber: 22,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "client/src/pages/Showcase.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}

},{"react/jsx-dev-runtime":"react/jsx-dev-runtime","lucide-react":"lucide-react","@/components/3DAgentCard":"@/components/3DAgentCard","@/components/FloatingOrb":"@/components/FloatingOrb","@/components/GlassCard":"@/components/GlassCard","@/components/ui/button":"@/components/ui/button","wouter":"wouter","@parcel/transformer-js/src/esmodule-helpers.js":"ahW7q"}],"3oDGa":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "COOKIE_NAME", ()=>(0, _const.COOKIE_NAME));
parcelHelpers.export(exports, "ONE_YEAR_MS", ()=>(0, _const.ONE_YEAR_MS));
parcelHelpers.export(exports, "APP_TITLE", ()=>APP_TITLE);
parcelHelpers.export(exports, "APP_LOGO", ()=>APP_LOGO);
parcelHelpers.export(exports, "getLoginUrl", ()=>getLoginUrl);
var _const = require("@shared/const");
var $e1f24b79dad2a27f$import_meta = Object.assign(Object.create(null), {
    url: "file:///client/src/const.ts"
});
const APP_TITLE = $e1f24b79dad2a27f$import_meta.env.VITE_APP_TITLE || "App";
const APP_LOGO = "https://placehold.co/128x128/E1E7EF/1F2937?text=App";
const getLoginUrl = ()=>{
    const oauthPortalUrl = $e1f24b79dad2a27f$import_meta.env.VITE_OAUTH_PORTAL_URL || $e1f24b79dad2a27f$import_meta.env.VITE_OAUTH_SERVER_URL;
    const appId = $e1f24b79dad2a27f$import_meta.env.VITE_APP_ID || $e1f24b79dad2a27f$import_meta.env.APP_ID || "";
    // Verificar se são valores de placeholder ou inválidos
    const isPlaceholder = (value)=>{
        if (!value) return true;
        const placeholderValues = [
            "your_app_id",
            "your_jwt_secret",
            "your_owner_open_id",
            "https://oauth.manus.computer"
        ];
        return placeholderValues.some((placeholder)=>value.toLowerCase().includes(placeholder.toLowerCase()));
    };
    // Se não houver URL de OAuth configurada ou for placeholder, retornar rota local
    if (!oauthPortalUrl || oauthPortalUrl === "" || oauthPortalUrl === "http://localhost:3000" || isPlaceholder(oauthPortalUrl) || isPlaceholder(appId)) {
        // Não logar repetidamente - só em desenvolvimento e uma vez
        if ($e1f24b79dad2a27f$import_meta.env.DEV && !window.__oauth_logged) {
            console.log("OAuth n\xe3o configurado. Usando rota local.");
            window.__oauth_logged = true;
        }
        return "/";
    }
    try {
        const redirectUri = `${window.location.origin}/api/oauth/callback`;
        const state = btoa(redirectUri);
        const url = new URL(`${oauthPortalUrl}/app-auth`);
        if (appId && !isPlaceholder(appId)) url.searchParams.set("appId", appId);
        url.searchParams.set("redirectUri", redirectUri);
        url.searchParams.set("state", state);
        url.searchParams.set("type", "signIn");
        return url.toString();
    } catch (error) {
        // Se houver erro ao criar URL, retornar rota local
        console.warn("Erro ao criar URL de OAuth:", error);
        return "/";
    }
};

},{"@shared/const":"@shared/const","@parcel/transformer-js/src/esmodule-helpers.js":"ahW7q"}],"6NYJW":[function() {},{}]},["6R0pI","1TADD"], "1TADD", "parcelRequired688", {"react/jsx-dev-runtime": __parcelExternal0,"@/lib/trpc": __parcelExternal1,"@shared/const": __parcelExternal2,"@tanstack/react-query": __parcelExternal3,"@trpc/client": __parcelExternal4,"react-dom/client": __parcelExternal5,"superjson": __parcelExternal6,"@/components/ui/sonner": __parcelExternal7,"@/components/ui/tooltip": __parcelExternal8,"@/pages/NotFound": __parcelExternal9,"wouter": __parcelExternal10,"@/lib/utils": __parcelExternal11,"lucide-react": __parcelExternal12,"react": __parcelExternal13,"@/_core/hooks/useAuth": __parcelExternal14,"@/components/ui/button": __parcelExternal15,"@/const": __parcelExternal16,"@/components/Sidebar": __parcelExternal17,"@/components/AdvancedChatInterface": __parcelExternal18,"@/components/RightPanel": __parcelExternal19,"@/components/AgentTeamVisualization": __parcelExternal20,"@/hooks/useMobile": __parcelExternal21,"@/hooks/usePWA": __parcelExternal22,"@/hooks/useFullscreen": __parcelExternal23,"@/components/HeroSection": __parcelExternal24,"@/components/GlassCard": __parcelExternal25,"@/components/3DAgentCard": __parcelExternal26,"framer-motion": __parcelExternal27,"@/components/FloatingOrb": __parcelExternal28,})
let {} = parcelRequired688("1TADD");
export {};

//# sourceMappingURL=client.8b2f680b.js.map
