const GAME_ID = "vampiresurvivors";
const GAME_NAME = "Vampire Suvivors";
const GAME_EXE = "VampireSurvivors.exe";
const STEAM_APP_ID = "1794680";
const NEW_MOD_EXT = ".dll";
const OLD_MOD_EXT = ".js";

const mod_loader = "https://www.nexusmods.com/vampiresurvivors/mods/64";
const melon_loader = "https://github.com/LavaGang/MelonLoader/releases";

let IS_NEW_ENGINE;
let CONTEXT_API;

const winapi = require("winapi-bindings");
const { fs, util, log } = require("vortex-api");
const vortex_api = require("vortex-api");
const path = require("path");

function main(context) {
  CONTEXT_API = context.api;
  context.registerGame({
    id: GAME_ID,
    name: GAME_NAME,
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => "",
    logo: "gameart.jpg",
    executable: () => GAME_EXE,
    requiredFiles: [GAME_EXE],
    setup: prepareForModding,
    environment: { SteamAPPId: STEAM_APP_ID },
    details: { steamAppId: STEAM_APP_ID },
  });

  context.registerInstaller("vampiresurvivors-oldengine-mod", 25, testSupportedContentOldEngine, installContentOldEngine);
  context.registerInstaller("vampiresurvivors-newengine-mod", 25, testSupportedContentNewEngine, installContentNewEngine);

  try {
    context.api.events.on("did-install-mod", async (gameId, archiveId, modId) => onDidInstallMod(gameId, archiveId, modId, context));
  } catch (err) {}

  return true;
}

function findGame() {
  return util.steam
    .findByAppId([STEAM_APP_ID])
    .then((game) => game.gamePath)
    .catch(() => {
      const instPath = winapi.RegGetValue("HKEY_LOCAL_MACHINE", "SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App " + STEAM_APP_ID, "InstallLocation");
      if (!instPath) throw new Error("empty registry key");
      return Promise.resolve(instPath.value);
    });
}

async function prepareForModding(discovery) {
  const modloaderpath = path.join(discovery.path, "resources", "app", ".webpack", "renderer", "mod_loader");
  const isNew = await isNewEngine(discovery);
  log("info", `Is New Engine: "${isNew}"`);
  if (isNew) {
    return fs.ensureDirWritableAsync(path.join(discovery.path, "MelonLoader")).then(() => checkForMelonLoader(path.join(discovery.path, "MelonLoader", "MelonLoader.xml")));
  } else {
    return fs.ensureDirWritableAsync(path.join(modloaderpath, "mods")).then(() => checkForModLoader(path.join(modloaderpath, "index.js")));
  }
}

async function isNewEngine(discovery) {
  const isNew = await fs
    .statAsync(path.join(discovery.path, "UnityCrashHandler64.exe"))
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });
  IS_NEW_ENGINE = isNew;
  return isNew;
}

function checkForModLoader(modloaderpath) {
  return fs.statAsync(modloaderpath).catch(() => {
    CONTEXT_API.sendNotification({
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

function checkForMelonLoader(melonloaderpath) {
  return fs.statAsync(melonloaderpath).catch(() => {
    CONTEXT_API.sendNotification({
      id: "melon_loader-missing",
      type: "warning",
      title: "MelonLoader not found",
      message: "MelonLoader is necessary to use mods",
      actions: [
        {
          title: "Get MelonLoader",
          action: () => util.opn(melon_loader).catch(() => undefined),
        },
      ],
    });
  });
}

async function testSupportedContentOldEngine(files, gameId, modPath) {
  const supported = gameId === GAME_ID && files.some((file) => path.extname(file).toLowerCase() === OLD_MOD_EXT);
  if (supported && IS_NEW_ENGINE) {
    CONTEXT_API.sendNotification({
      id: "is_new_engine",
      type: "warning",
      title: `Old Mod but New Engine [${path.parse(path.basename(modPath)).name}]`,
      message: "You are trying to install a Mod for the Old Engine on the New Engine",
    });
  }
  return { supported, requiredFiles: [] };
}

async function installContentOldEngine(files) {
  const filtered = files.filter((file) => path.extname(file) !== "");
  const instructions = filtered.map((file) => {
    log("info", `Installing file Old Engine: "${file}"`);
    return {
      type: "copy",
      source: file,
      destination: file,
    };
  });
  return { instructions };
}

/*
async function installContentOldEngine(files) {
  const topDirPath = files.find((file) => path.basename(file).toLowerCase() === "resources");
  const topDir = topDirPath ? topDirPath.toLowerCase() : "";
  const topDirName = path.basename(topDir);
  const idx = topDir ? topDir.indexOf(topDirName) + topDirName.length : 0;
  const instructions = files.map((file) => {
    log("info", `Installing file Old Engine: Source: "${file}" destination: "resources${file.substr(idx)}"`);
    return {
      type: "copy",
      source: file,
      destination: "resources" + file.substr(idx),
    };
  });
  return { instructions };
}*/

async function testSupportedContentNewEngine(files, gameId, modPath) {
  const supported = gameId === GAME_ID && files.some((file) => path.extname(file).toLowerCase() === NEW_MOD_EXT);
  if (supported && !IS_NEW_ENGINE) {
    CONTEXT_API.sendNotification({
      id: "is_new_engine",
      type: "warning",
      title: `New Mod but Old Engine [${path.parse(path.basename(modPath)).name}]`,
      message: "You are trying to install a Mod for the new Engine on the Old Engine",
    });
  }
  return { supported, requiredFiles: [] };
}

async function installContentNewEngine(files) {
  const filtered = files.filter((file) => path.extname(file) !== "");
  const instructions = filtered.map((file) => {
    log("info", `Installing file New Engine: "${file}"`);
    return {
      type: "copy",
      source: file,
      destination: file,
    };
  });
  return { instructions };
}

/*
async function installContentNewEngine(files) {
  const modFile = files.find((file) => path.extname(file).toLowerCase() === NEW_MOD_EXT);
  const idx = modFile.indexOf(path.basename(modFile));
  const rootPath = path.dirname(modFile);
  const modsPath = path.join(rootPath, "Mods");
  fs.ensureDirWritableAsync(modsPath);
  const userDataPath = path.join(rootPath, "UserData");
  fs.ensureDirWritableAsync(userDataPath);

  const filtered = files.filter((file) => file.indexOf(rootPath) !== -1 && !file.endsWith(path.sep));

  const instructions = filtered.map((file) => {
    let destination = file.substr(idx);
    if (path.extname(file).toLowerCase() === NEW_MOD_EXT) destination = path.join(modsPath, destination);
    else if (path.extname(file).toLowerCase() === ".ttf") destination = path.join(userDataPath, destination);
    log("info", `Installing file New Engine. Source: "${file}" destination: "${destination}"`);
    return {
      type: "copy",
      source: file,
      destination: destination,
    };
  });
  return { instructions };
}*/

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

function fixGetMods(filePath) {
  try {
    let data = fs.readFileSync(filePath, "utf8");

    const getModsRegex = /getMods\s*\(\)\s*{([\s\S]*?)}/;
    const readdirSyncRegex = /"mods\/"\),\s*{\s*withFileTypes:\s*true\s*}/;

    const getModsMatch = data.match(getModsRegex);
    if (!getModsMatch) return;

    const readdirSyncMatch = getModsMatch[0].match(readdirSyncRegex);
    if (!readdirSyncMatch) return;

    const modifiedData = data.replace(readdirSyncRegex, `${readdirSyncMatch[0]}).filter((dir) => dir.name !== "__folder_managed_by_vortex"`);

    fs.writeFileSync(filePath, modifiedData, "utf8");
    return true;
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
        const fileName = dirname + OLD_MOD_EXT;
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

module.exports = {
  default: main,
};
