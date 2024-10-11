#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to ask a question and store the answer in the config object
function askQuestion(question, defaultAnswer) {
  return new Promise((resolve) =>
    rl.question(`${question} (${defaultAnswer}): `, resolve)
  ).then((a) => (a?.length ? a : defaultAnswer));
}

async function getShouldEnable(name) {
  const shouldEnable = await askQuestion(`Enable "${name}"`, "yes");
  return shouldEnable === "yes";
}

/** @typedef {Object} ApiNextTanstackConfig
 *  @property {?string} outputPath
 *  @property {string} hooksFieldRequestsImportPath
 *  @property {string} useHandleMutationErrorImportPath
 */

/** @typedef {Object} Config
 *  @property {"commonjs" | "module"} type
 *  @property {?string} libImportPath
 *  @property {string} schemaPath
 *  @property {string} entityPath
 *  @property {?string[]} [augmentors]
 *  @property {?Template[]} [templates]
 *  @property {?ApiNextTanstackConfig} apiNextTanstack
 */

const PROJECT_PATH = process.cwd();
const CONFIG_FILE_PATH = path.join(PROJECT_PATH, "airent.config.json");

const AIRENT_API_NEXT_TANSTACK_RESOURCES_PATH =
  "node_modules/@airent/api-next-tanstack/resources";

const API_NEXT_TANSTACK_AUGMENTOR_PATH = `${AIRENT_API_NEXT_TANSTACK_RESOURCES_PATH}/augmentor.js`;

const API_NEXT_TANSTACT_BASE_TEMPLATE_CONFIG = {
  name: `${AIRENT_API_NEXT_TANSTACK_RESOURCES_PATH}/base-template.ts.ejs`,
  outputPath: `{apiNextTanstack.outputPath}/{kababEntityName}-base.ts`,
  skippable: false,
};
const API_NEXT_TANSTACT_TYPES_TEMPLATE_CONFIG = {
  name: `${AIRENT_API_NEXT_TANSTACK_RESOURCES_PATH}/types-template.ts.ejs`,
  outputPath: `{apiNextTanstack.outputPath}/{kababEntityName}-types.ts`,
  skippable: false,
};
const API_NEXT_TANSTACT_CLIENT_HOOKS_TEMPLATE_CONFIG = {
  name: `${AIRENT_API_NEXT_TANSTACK_RESOURCES_PATH}/client-hooks-template.ts.ejs`,
  outputPath: `{apiNextTanstack.outputPath}/{kababEntityName}-client.ts`,
  skippable: false,
};
const API_NEXT_TANSTACT_SERVER_HOOKS_TEMPLATE_CONFIG = {
  name: `${AIRENT_API_NEXT_TANSTACK_RESOURCES_PATH}/server-hooks-template.ts.ejs`,
  outputPath: `{apiNextTanstack.outputPath}/{kababEntityName}-server.ts`,
  skippable: false,
};
const API_NEXT_TANSTACK_SERVER_CACHED_HOOKS_TEMPLATE_CONFIG = {
  name: `${AIRENT_API_NEXT_TANSTACK_RESOURCES_PATH}/server-cached-hooks-template.ts.ejs`,
  outputPath: `{apiNextTanstack.outputPath}/{kababEntityName}-server-cached.ts`,
  skippable: false,
};

const API_NEXT_TANSTACK_TEMPLATE_CONFIGS = [
  API_NEXT_TANSTACT_BASE_TEMPLATE_CONFIG,
  API_NEXT_TANSTACT_TYPES_TEMPLATE_CONFIG,
  API_NEXT_TANSTACT_CLIENT_HOOKS_TEMPLATE_CONFIG,
  API_NEXT_TANSTACT_SERVER_HOOKS_TEMPLATE_CONFIG,
  API_NEXT_TANSTACK_SERVER_CACHED_HOOKS_TEMPLATE_CONFIG,
];

async function loadConfig() {
  const configContent = await fs.promises.readFile(CONFIG_FILE_PATH, "utf8");
  const config = JSON.parse(configContent);
  const augmentors = config.augmentors ?? [];
  const templates = config.templates ?? [];
  return { ...config, augmentors, templates };
}

function addTemplate(config, draftTemplate) {
  const { templates } = config;
  const template = templates.find((t) => t.name === draftTemplate.name);
  if (template === undefined) {
    templates.push(draftTemplate);
  }
}

async function configure() {
  const config = await loadConfig();
  const { augmentors } = config;
  const isAugmentorEnabled = augmentors.includes(
    API_NEXT_TANSTACK_AUGMENTOR_PATH
  );
  const shouldEnableApiNextTanstack = isAugmentorEnabled
    ? true
    : await getShouldEnable("Api Next Tanstack");
  if (!shouldEnableApiNextTanstack) {
    return;
  }
  if (!isAugmentorEnabled) {
    augmentors.push(API_NEXT_TANSTACK_AUGMENTOR_PATH);
  }
  API_NEXT_TANSTACK_TEMPLATE_CONFIGS.forEach((t) => addTemplate(config, t));

  config.apiNextTanstack = config.apiNextTanstack ?? {};

  config.apiNextTanstack.outputPath = await askQuestion(
    "API Next Tanstack Output Path",
    config.apiNextTanstack.outputPath ?? "./src/hooks"
  );

  config.apiNextTanstack.hooksFieldRequestsImportPath = await askQuestion(
    "Import path for field requests to be used in hooks",
    config.apiNextTanstack.hooksFieldRequestsImportPath ??
      "./src/hooks-field-requests"
  );

  config.apiNextTanstack.useHandleMutationErrorImportPath = await askQuestion(
    'Import path for "useHandleMutationError"',
    config.apiNextTanstack.useHandleMutationErrorImportPath ??
      "./src/useHandleMutationError"
  );

  const content = JSON.stringify(config, null, 2) + "\n";
  await fs.promises.writeFile(CONFIG_FILE_PATH, content);
  console.log(`[AIRENT-API-NEXT-TANSTACK/INFO] Package configured.`);
}

async function main() {
  try {
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      throw new Error(
        '[AIRENT-API-NEXT-TANSTACK/ERROR] "airent.config.json" not found'
      );
    }
    await configure();
  } finally {
    rl.close();
  }
}

main().catch(console.error);
