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
}

function main(context) {
  applyGame(context, spec);
  context.once(() => {});
  return true;
}

module.exports = {
  default: main,
};
