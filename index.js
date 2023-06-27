// Created with Add Game Wizard (https://www.nexusmods.com/site/mods/155)

const spec = {
  game: {
    id: "vampiresurvivors",
    name: "Vampire Survivors",
    executable: "VampireSurvivors.exe",
    logo: "gameart.jpg",
    mergeMods: true,
    modPath: ".",
    modPathIsRelative: true,
    requiredFiles: ["VampireSurvivors.exe", "resources/app/.webpack/renderer/main.bundle.js"],
    details: {
      steamAppId: 1794680,
      nexusPageId: "vampiresurvivors",
    },
    environment: {
      SteamAPPId: "1794680",
    },
  },
  discovery: {
    ids: ["1794680"],
    names: [],
  },
};

const tools = [];

const { actions, fs, util } = require("vortex-api");
const vortex_api = require("vortex-api");
const path = require("path");
const template = require("string-template");

const mod_loader = "https://www.nexusmods.com/vampiresurvivors/mods/64";

function modTypePriority(priority) {
  return {
    high: 25,
    low: 75,
  }[priority];
}

function pathPattern(api, game, pattern) {
  var _a;
  return template(pattern, {
    gamePath: (_a = api.getState().settings.gameMode.discovered[game.id]) === null || _a === void 0 ? void 0 : _a.path,
    documents: util.getVortexPath("documents"),
    localAppData: process.env["LOCALAPPDATA"],
    appData: util.getVortexPath("appData"),
  });
}

function makeFindGame(api, gameSpec) {
  return () =>
    util.GameStoreHelper.findByAppId(gameSpec.discovery.ids)
      .catch(() => util.GameStoreHelper.findByName(gameSpec.discovery.names))
      .then((game) => game.gamePath);
}

function makeGetModPath(api, gameSpec) {
  return () => (gameSpec.game.modPathIsRelative !== false ? gameSpec.game.modPath || "." : pathPattern(api, gameSpec.game, gameSpec.game.modPath));
}

function makeRequiresLauncher(api, gameSpec) {
  return () => Promise.resolve(gameSpec.game.requiresLauncher !== undefined ? { launcher: gameSpec.game.requiresLauncher } : undefined);
}

function prepareForModding(discovery, api, enabledMods) {
  const modloaderpath = path.join(discovery.path, "resources", "app", ".webpack", "renderer", "mod_loader", "index.js");
  return fs.ensureDirWritableAsync(path.join(discovery.path, "resources", "app", ".webpack", "renderer", "mod_loader", "mods")).then(() => checkForModLoader(api, modloaderpath));
}

function checkForModLoader(api, modloaderpath) {
  return fs.statAsync(modloaderpath).catch(() => {
    api.sendNotification({
      id: "mod_loader-missing",
      type: "warning",
      title: "ModLoader not found",
      message: "ModLoader is recommended to install mods",
      actions: [
        {
          title: "Get ModLoader",
          action: () => util.opn(mod_loader).catch(() => undefined),
        },
      ],
    });
  });
}

function findModsFolder(folderPath) {
  try {
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        if (file === "mods") {
          return filePath;
        } else {
          const modsFolderPath = findModsFolder(filePath);
          if (modsFolderPath) {
            return modsFolderPath;
          }
        }
      }
    }
    return;
  } catch (err) {
    return;
  }
}

function findMainModFile(modPath) {
  try {
    const modsFolderPath = findModsFolder(modPath);
    const files = fs.readdirSync(modsFolderPath);
    let dirname;
    for (const file of files) {
      const filePath = path.join(modsFolderPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        dirname = path.basename(filePath);
        const fileName = dirname + ".js";
        const targetFilePath = path.join(filePath, fileName);
        const exists = fs.statSync(targetFilePath, (err, stats) => {
          if (!err && stats.isFile()) {
            return targetFilePath;
          } else {
            return;
          }
        });
        if (exists) {
          return targetFilePath;
        } else {
          return;
        }
      }
    }
  } catch (err) {
    return;
  }
}

function fixGetMods(filePath) {
  try {
    let data = fs.readFileSync(filePath, "utf8");

    const getModsRegex = /getMods\s*\(\)\s*{([\s\S]*?)}/;
    const readdirSyncRegex = /{\s*withFileTypes:\s*true\s*}/;

    const getModsMatch = data.match(getModsRegex);
    if (!getModsMatch) return;

    const readdirSyncMatch = getModsMatch[0].match(readdirSyncRegex);
    if (!readdirSyncMatch) return;

    const modifiedData = data.replace(readdirSyncRegex, `${readdirSyncMatch[0]}).filter((dir) => dir.isFile() && dir.name !== "__folder_managed_by_vortex"`);

    fs.writeFileSync(filePath, modifiedData, "utf8");
    return true;
  } catch (err) {
    return;
  }
}

async function onDidInstallMod(gameId, archiveId, modId, context) {
  const state = context.api.getState();
  const installPath = vortex_api.selectors.installPathForGame(state, gameId);
  const mod = (_b = (_a = state.persistent.mods) === null || _a === void 0 ? void 0 : _a[gameId]) === null || _b === void 0 ? void 0 : _b[modId];
  if (installPath === undefined || (mod === null || mod === void 0 ? void 0 : mod.installationPath) === undefined) {
    return;
  }
  const modPath = path.join(installPath, mod.installationPath);
  const mainModPath = findMainModFile(modPath);
  if (mainModPath) {
    const success = fixGetMods(mainModPath);
    if (success) {
      context.api.sendNotification({
        id: "fix_success_" + modId,
        type: "info",
        title: "Fixed Mod",
        message: 'Successfully fixed Mod "' + modId + '"',
      });
    }
  }
}

function applyGame(context, gameSpec) {
  const game = {
    ...gameSpec.game,
    queryPath: makeFindGame(context.api, gameSpec),
    queryModPath: makeGetModPath(context.api, gameSpec),
    requiresLauncher: makeRequiresLauncher(context.api, gameSpec),
    requiresCleanup: true,
    executable: () => gameSpec.game.executable,
    setup: (discovery) => prepareForModding(discovery, context.api),
    supportedTools: tools,
  };
  context.registerGame(game);
  (gameSpec.modTypes || []).forEach((type, idx) => {
    context.registerModType(
      type.id,
      modTypePriority(type.priority) + idx,
      (gameId) => {
        var _a;
        return gameId === gameSpec.game.id && !!((_a = context.api.getState().settings.gameMode.discovered[gameId]) === null || _a === void 0 ? void 0 : _a.path);
      },
      (game) => pathPattern(context.api, game, type.targetPath),
      () => Promise.resolve(false),
      { name: type.name }
    );
  });

  try {
    context.api.events.on("did-install-mod", async (gameId, archiveId, modId) => onDidInstallMod(gameId, archiveId, modId, context));
  } catch (err) {}
}

function main(context) {
  applyGame(context, spec);
  context.once(() => {});
  return true;
}

module.exports = {
  default: main,
};
