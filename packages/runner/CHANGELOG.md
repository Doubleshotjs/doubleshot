## [0.0.10](https://github.com/archergu/doubleshot/compare/runner@0.0.9...runner@0.0.10) (2023-11-10)


### Bug Fixes

* **deps:** update dependency esbuild to ^0.19.0 ([38f9d0e](https://github.com/archergu/doubleshot/commit/38f9d0e2d52206948efca1b21b138c52a986e4a3))


### Features

* **runner:** support multi-format line command ([283f769](https://github.com/archergu/doubleshot/commit/283f76908ae1aa6b233c2461a03c47f14ce91823))



## [0.0.9](https://github.com/archergu/doubleshot/compare/runner@0.0.8...runner@0.0.9) (2023-06-15)


### Bug Fixes

* **deps:** update dependency concurrently to v8 ([2eef5d5](https://github.com/archergu/doubleshot/commit/2eef5d5b175d28b19fb5a8514c51069abcc65740))
* **deps:** update dependency esbuild to ^0.15.0 ([5f7f604](https://github.com/archergu/doubleshot/commit/5f7f604cf9c895840bc7b13aa5c9b41524da8dba))
* **deps:** update dependency esbuild to ^0.16.0 ([367d94f](https://github.com/archergu/doubleshot/commit/367d94f1ca517cd2ef7ede8f5cd45e8601d7909d))
* **deps:** update dependency esbuild to ^0.18.0 ([f54d925](https://github.com/archergu/doubleshot/commit/f54d92526d1ac6f72adfaff8e401f2c41ad21839))
* optional peer dependencies check ([ab4857d](https://github.com/archergu/doubleshot/commit/ab4857d299f1639f51340cc53738a0c2ca0a6926))
* **runner:** electron builder will still run if cmd is killed ([2b4cb3a](https://github.com/archergu/doubleshot/commit/2b4cb3af55cb241b7f1219a41fe1417edea12371))
* **runner:** kill other with right signal ([6696df9](https://github.com/archergu/doubleshot/commit/6696df9da57ba3ee6f83e24d6d62af0a3596ec62))


### Features

* add builder dev mode ([b2ef6dc](https://github.com/archergu/doubleshot/commit/b2ef6dce87670d4167e36f19e65a3c07edabbbba))
* **builder:** support wait renderer url(dev mode) ([7b71b30](https://github.com/archergu/doubleshot/commit/7b71b30a3427551331b1fac577a996efde689abf))
* dsr(runner) ([9cbe285](https://github.com/archergu/doubleshot/commit/9cbe2853ae8b5b66b58590e6262305aca41d810b))
* runner support electron-builder ([f378208](https://github.com/archergu/doubleshot/commit/f3782081f55536b313b26e946ba30ba61567ed68))
* **runner:** `only` config now support an array ([48a21dc](https://github.com/archergu/doubleshot/commit/48a21dc6cb161fb050745e8f3a04bfc45caba4e6))
* **runner:** add 'only' option ([b8dcb1c](https://github.com/archergu/doubleshot/commit/b8dcb1c8b220f4f50d28c1208f51a23f675edc56))
* **runner:** if some cmd exit with 0 then will not exit with 1 ([64f1d78](https://github.com/archergu/doubleshot/commit/64f1d785dc8f6b44901c1d901f5b71cd862bc36c))
* **runner:** runner will exit by code 1 if some cmd throw error ([da56e22](https://github.com/archergu/doubleshot/commit/da56e2278f0a58b67400e65180c29d1918fc7b0a))
* **runner:** support filter option ([16c8588](https://github.com/archergu/doubleshot/commit/16c85885b47ec200c4a79d5cd6ca9088441c139d))
* **runner:** support inline option '--disable-electron-build' ([dfb401f](https://github.com/archergu/doubleshot/commit/dfb401fe7e80f7e07faf201c1be480ecf5ae6daf))
* **runner:** support run commands by alias ([0e79c0e](https://github.com/archergu/doubleshot/commit/0e79c0e1baef2cd0f6bb56032e749f52e829561d))



## [0.0.8](https://github.com/archergu/doubleshot/compare/runner@0.0.7...runner@0.0.8) (2023-06-14)


### Bug Fixes

* **deps:** update dependency concurrently to v8 ([2eef5d5](https://github.com/archergu/doubleshot/commit/2eef5d5b175d28b19fb5a8514c51069abcc65740))
* **deps:** update dependency esbuild to ^0.15.0 ([5f7f604](https://github.com/archergu/doubleshot/commit/5f7f604cf9c895840bc7b13aa5c9b41524da8dba))
* **deps:** update dependency esbuild to ^0.16.0 ([367d94f](https://github.com/archergu/doubleshot/commit/367d94f1ca517cd2ef7ede8f5cd45e8601d7909d))
* **deps:** update dependency esbuild to ^0.18.0 ([f54d925](https://github.com/archergu/doubleshot/commit/f54d92526d1ac6f72adfaff8e401f2c41ad21839))
* optional peer dependencies check ([ab4857d](https://github.com/archergu/doubleshot/commit/ab4857d299f1639f51340cc53738a0c2ca0a6926))
* **runner:** electron builder will still run if cmd is killed ([2b4cb3a](https://github.com/archergu/doubleshot/commit/2b4cb3af55cb241b7f1219a41fe1417edea12371))
* **runner:** kill other with right signal ([6696df9](https://github.com/archergu/doubleshot/commit/6696df9da57ba3ee6f83e24d6d62af0a3596ec62))


### Features

* add builder dev mode ([b2ef6dc](https://github.com/archergu/doubleshot/commit/b2ef6dce87670d4167e36f19e65a3c07edabbbba))
* **builder:** support wait renderer url(dev mode) ([7b71b30](https://github.com/archergu/doubleshot/commit/7b71b30a3427551331b1fac577a996efde689abf))
* dsr(runner) ([9cbe285](https://github.com/archergu/doubleshot/commit/9cbe2853ae8b5b66b58590e6262305aca41d810b))
* runner support electron-builder ([f378208](https://github.com/archergu/doubleshot/commit/f3782081f55536b313b26e946ba30ba61567ed68))
* **runner:** `only` config now support an array ([48a21dc](https://github.com/archergu/doubleshot/commit/48a21dc6cb161fb050745e8f3a04bfc45caba4e6))
* **runner:** add 'only' option ([b8dcb1c](https://github.com/archergu/doubleshot/commit/b8dcb1c8b220f4f50d28c1208f51a23f675edc56))
* **runner:** runner will exit by code 1 if some cmd throw error ([da56e22](https://github.com/archergu/doubleshot/commit/da56e2278f0a58b67400e65180c29d1918fc7b0a))
* **runner:** support filter option ([16c8588](https://github.com/archergu/doubleshot/commit/16c85885b47ec200c4a79d5cd6ca9088441c139d))
* **runner:** support run commands by alias ([0e79c0e](https://github.com/archergu/doubleshot/commit/0e79c0e1baef2cd0f6bb56032e749f52e829561d))



## [0.0.7](https://github.com/archergu/doubleshot/compare/runner@0.0.6...runner@0.0.7) (2023-06-14)


### Bug Fixes

* **deps:** update dependency concurrently to v8 ([2eef5d5](https://github.com/archergu/doubleshot/commit/2eef5d5b175d28b19fb5a8514c51069abcc65740))
* **deps:** update dependency esbuild to ^0.15.0 ([5f7f604](https://github.com/archergu/doubleshot/commit/5f7f604cf9c895840bc7b13aa5c9b41524da8dba))
* **deps:** update dependency esbuild to ^0.16.0 ([367d94f](https://github.com/archergu/doubleshot/commit/367d94f1ca517cd2ef7ede8f5cd45e8601d7909d))
* **deps:** update dependency esbuild to ^0.18.0 ([f54d925](https://github.com/archergu/doubleshot/commit/f54d92526d1ac6f72adfaff8e401f2c41ad21839))
* optional peer dependencies check ([ab4857d](https://github.com/archergu/doubleshot/commit/ab4857d299f1639f51340cc53738a0c2ca0a6926))
* **runner:** kill other with right signal ([6696df9](https://github.com/archergu/doubleshot/commit/6696df9da57ba3ee6f83e24d6d62af0a3596ec62))


### Features

* add builder dev mode ([b2ef6dc](https://github.com/archergu/doubleshot/commit/b2ef6dce87670d4167e36f19e65a3c07edabbbba))
* **builder:** support wait renderer url(dev mode) ([7b71b30](https://github.com/archergu/doubleshot/commit/7b71b30a3427551331b1fac577a996efde689abf))
* dsr(runner) ([9cbe285](https://github.com/archergu/doubleshot/commit/9cbe2853ae8b5b66b58590e6262305aca41d810b))
* runner support electron-builder ([f378208](https://github.com/archergu/doubleshot/commit/f3782081f55536b313b26e946ba30ba61567ed68))
* **runner:** `only` config now support an array ([48a21dc](https://github.com/archergu/doubleshot/commit/48a21dc6cb161fb050745e8f3a04bfc45caba4e6))
* **runner:** add 'only' option ([b8dcb1c](https://github.com/archergu/doubleshot/commit/b8dcb1c8b220f4f50d28c1208f51a23f675edc56))
* **runner:** runner will exit by code 1 if some cmd throw error ([da56e22](https://github.com/archergu/doubleshot/commit/da56e2278f0a58b67400e65180c29d1918fc7b0a))
* **runner:** support filter option ([16c8588](https://github.com/archergu/doubleshot/commit/16c85885b47ec200c4a79d5cd6ca9088441c139d))
* **runner:** support run commands by alias ([0e79c0e](https://github.com/archergu/doubleshot/commit/0e79c0e1baef2cd0f6bb56032e749f52e829561d))



## [0.0.6](https://github.com/archergu/doubleshot/compare/runner@0.0.5...runner@0.0.6) (2023-02-09)


### Features

* **runner:** `only` config now support an array ([48a21dc](https://github.com/archergu/doubleshot/commit/48a21dc6cb161fb050745e8f3a04bfc45caba4e6))



## [0.0.5](https://github.com/archergu/doubleshot/compare/runner@0.0.4...runner@0.0.5) (2023-01-10)


### Features

* **runner:** add 'only' option ([b8dcb1c](https://github.com/archergu/doubleshot/commit/b8dcb1c8b220f4f50d28c1208f51a23f675edc56))



## [0.0.4](https://github.com/archergu/doubleshot/compare/runner@0.0.3...runner@0.0.4) (2023-01-02)



## [0.0.3](https://github.com/archergu/doubleshot/compare/runner@0.0.2...runner@0.0.3) (2023-01-01)



## [0.0.2](https://github.com/archergu/doubleshot/compare/runner@0.0.1...runner@0.0.2) (2022-12-26)


### Bug Fixes

* **deps:** update dependency esbuild to ^0.16.0 ([367d94f](https://github.com/archergu/doubleshot/commit/367d94f1ca517cd2ef7ede8f5cd45e8601d7909d))
* **runner:** kill other with right signal ([6696df9](https://github.com/archergu/doubleshot/commit/6696df9da57ba3ee6f83e24d6d62af0a3596ec62))


### Features

* **runner:** support filter option ([16c8588](https://github.com/archergu/doubleshot/commit/16c85885b47ec200c4a79d5cd6ca9088441c139d))



## [0.0.1](https://github.com/archergu/doubleshot/compare/runner@0.1.0-beta.0...runner@0.0.1) (2022-09-02)


### Bug Fixes

* **deps:** update dependency esbuild to ^0.15.0 ([5f7f604](https://github.com/archergu/doubleshot/commit/5f7f604cf9c895840bc7b13aa5c9b41524da8dba))



# [0.1.0-beta.0](https://github.com/archergu/doubleshot/compare/runner@0.1.0-alpha.3...runner@0.1.0-beta.0) (2022-08-03)



# [0.1.0-alpha.3](https://github.com/archergu/doubleshot/compare/runner@0.1.0-alpha.2...runner@0.1.0-alpha.3) (2022-07-21)



# [0.1.0-alpha.2](https://github.com/Doubleshotjs/doubleshot/compare/runner@0.1.0-alpha.1...runner@0.1.0-alpha.2) (2022-07-19)



# [0.1.0-alpha.1](https://github.com/Doubleshotjs/doubleshot/compare/runner@0.1.0-alpha.0...runner@0.1.0-alpha.1) (2022-07-19)



# 0.1.0-alpha.0 (2022-07-11)


### Bug Fixes

* optional peer dependencies check ([ab4857d](https://github.com/Doubleshotjs/doubleshot/commit/ab4857d299f1639f51340cc53738a0c2ca0a6926))


### Features

* add builder dev mode ([b2ef6dc](https://github.com/Doubleshotjs/doubleshot/commit/b2ef6dce87670d4167e36f19e65a3c07edabbbba))
* **builder:** support wait renderer url(dev mode) ([7b71b30](https://github.com/Doubleshotjs/doubleshot/commit/7b71b30a3427551331b1fac577a996efde689abf))
* dsr(runner) ([9cbe285](https://github.com/Doubleshotjs/doubleshot/commit/9cbe2853ae8b5b66b58590e6262305aca41d810b))
* runner support electron-builder ([f378208](https://github.com/Doubleshotjs/doubleshot/commit/f3782081f55536b313b26e946ba30ba61567ed68))
* **runner:** support run commands by alias ([0e79c0e](https://github.com/Doubleshotjs/doubleshot/commit/0e79c0e1baef2cd0f6bb56032e749f52e829561d))



