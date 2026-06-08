export const APP_VERSION = __APP_VERSION__;
export const BUILD_COUNT = __BUILD_COUNT__;
export const BUILD_SHA = __BUILD_SHA__;

/** Compact label for the footer, e.g. "v3.0.0-beta (2050)". */
export const VERSION_LABEL = `v${APP_VERSION} (${BUILD_COUNT})`;

/** Build-time portion of the tooltip. The schema version is appended at render time. */
export const VERSION_FULL_BASE = `${APP_VERSION} · build ${BUILD_COUNT} · ${BUILD_SHA}`;
