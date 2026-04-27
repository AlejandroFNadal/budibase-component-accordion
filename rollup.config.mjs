import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import svelte from "rollup-plugin-svelte"
import terser from "@rollup/plugin-terser"
import postcss from "rollup-plugin-postcss"
import svg from "rollup-plugin-svg"
import json from "@rollup/plugin-json"
import nodePolyfills from "rollup-plugin-polyfill-node"
import tar from "tar"
import path from "path"
import fs from "fs"
import crypto from "crypto"
import { validate } from "@budibase/backend-core/plugins"

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"))

const ignoredWarnings = [
  "css-unused-selector",
  "a11y-no-onchange",
  "a11y_no_static_element_interactions",
  "a11y_click_events_have_key_events",
  // `let open = $state(openDefault)` is intentional: an $effect re-syncs
  // `open` when the prop changes, mirroring Svelte 4's `$: open = openDefault`.
  "state_referenced_locally",
  // <slot/> is required here for Wrapper interop with the host's Svelte 4
  // component API (componentApi: 4). Migration to {@render children()} is a
  // separate change and would cascade to Wrapper.svelte too.
  "slot_element_deprecated",
]

const clean = () => ({
  name: "clean",
  buildStart() {
    const dist = "./dist/"
    if (fs.existsSync(dist)) {
      fs.readdirSync(dist).forEach(file => {
        if (file.endsWith(".tar.gz")) {
          fs.unlinkSync(dist + file)
        }
      })
    }
  },
})

const copyAssets = (assets) => ({
  name: "copy-assets",
  writeBundle() {
    fs.mkdirSync("./dist", { recursive: true })
    for (const asset of assets) {
      fs.copyFileSync(asset, path.join("./dist", path.basename(asset)))
    }
  },
})

const hash = () => ({
  writeBundle() {
    const fileBuffer = fs.readFileSync("dist/plugin.min.js")
    const hashSum = crypto.createHash("sha1")
    hashSum.update(fileBuffer)
    const hex = hashSum.digest("hex")

    const schema = JSON.parse(fs.readFileSync("./dist/schema.json", "utf8"))

    const newSchema = {
      ...schema,
      hash: hex,
      version: pkg.version,
    }
    fs.writeFileSync("./dist/schema.json", JSON.stringify(newSchema, null, 2))
  },
})

const bundle = () => ({
  async writeBundle() {
    const bundleName = `${pkg.name}-${pkg.version}.tar.gz`
    return tar
        .c({ gzip: true, cwd: "dist" }, [
          "plugin.min.js",
          "schema.json",
          "package.json",
        ])
        .pipe(fs.createWriteStream(`dist/${bundleName}`))
  },
})

const validateSchema = () => ({
  buildStart() {
    const schema = fs.readFileSync("schema.json", "utf8")
    validate(JSON.parse(schema))
  }
})

export default {
  input: "index.js",
  // Svelte is provided by the Budibase host (3.24.0+) as window globals,
  // so we treat it as external to share the host's runtime — bundling our
  // own copy would create a separate component-context map and break
  // getContext("sdk").
  external: (id) => id === "svelte" || id.startsWith("svelte/"),
  output: {
    sourcemap: process.env.ROLLUP_WATCH ? "inline" : false,
    format: "iife",
    file: "dist/plugin.min.js",
    name: "plugin",
    globals: (id) =>
      id === "svelte/store"
        ? "svelteStore"
        : id.includes("/internal")
        ? "svelteInternal"
        : "svelte",
  },
  plugins: [
    validateSchema(),
    clean(),
    svelte({
      emitCss: true,
      compilerOptions: {
        // Host instantiates plugin components with the Svelte 4 component API
        // (new Component({ target, props, $$slots })), so we keep that surface.
        compatibility: {
          componentApi: 4,
        },
      },
      onwarn: (warning, handler) => {
        if (!ignoredWarnings.includes(warning.code)) {
          handler(warning)
        }
      },
    }),
    postcss(),
    commonjs(),
    nodePolyfills(),
    resolve({
      preferBuiltins: true,
      browser: true,
    }),
    svg(),
    json(),
    terser(),
    copyAssets(["schema.json", "package.json"]),
    hash(),
    bundle(),
  ],
}
