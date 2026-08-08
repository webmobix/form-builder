---
"@webmobix/form-components": patch
"@webmobix/form-components-react": patch
---

Fix broken publish: include dist/ and loader/ output in the published package. The previous 0.1.0 release shipped an empty tarball (no dist/), making it unimportable.
