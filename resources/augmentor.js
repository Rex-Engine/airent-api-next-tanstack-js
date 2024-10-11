const path = require("path");
const utils = require("airent/resources/utils.js");

function enforceRelativePath(relativePath) /* string */ {
  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}

function joinRelativePath(...elements) /* string */ {
  return enforceRelativePath(path.join(...elements).replaceAll("\\", "/"));
}

function buildRelativePackage(sourcePath, targetPath, config) /* string */ {
  if (!targetPath.startsWith(".")) {
    return targetPath;
  }
  const suffix = utils.getModuleSuffix(config);
  const relativePath = enforceRelativePath(
    path.relative(sourcePath, targetPath).replaceAll("\\", "/")
  );
  return `${relativePath}${suffix}`;
}

// augment entity - add packages

function addPackages(entity, config) {
  if (config.apiNextTanstack) {
    const kababEntName = utils.toKababCase(entity.name);
    entity.apiNextTanstack = {
      packages: {
        hookType: buildRelativePackage(
          config.apiNextTanstack.outputPath,
          joinRelativePath(
            config.entityPath,
            "generated",
            `${kababEntName}-type`
          ),
          config
        ),
        hookFieldRequests: buildRelativePackage(
          config.apiNextTanstack.outputPath,
          config.apiNextTanstack.hooksFieldRequestsImportPath,
          config
        ),
        hookClientClient: buildRelativePackage(
          config.apiNextTanstack.outputPath,
          joinRelativePath(config.api.client.clientPath, kababEntName),
          config
        ),
        hookServerClient: buildRelativePackage(
          config.apiNextTanstack.outputPath,
          joinRelativePath(config.apiNext.serverClientPath, kababEntName),
          config
        ),
        hookServerCachedClient: buildRelativePackage(
          config.apiNextTanstack.outputPath,
          joinRelativePath(
            config.apiNext.serverClientPath,
            `${kababEntName}-cached`
          ),
          config
        ),
        hookMutationErrorHandler: buildRelativePackage(
          config.apiNextTanstack.outputPath,
          config.apiNextTanstack.useHandleMutationErrorImportPath,
          config
        ),
      },
    };
  }
}

function augment(data) {
  const { entityMap, config } = data;
  const entityNames = Object.keys(entityMap).sort();
  const entities = entityNames.map((n) => entityMap[n]);
  entities.forEach((entity) => addPackages(entity, config));
}

module.exports = { augment };
