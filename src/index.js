const GAME_ID = 'vampiresurvivors';
const GAME_NAME = 'Vampire Survivors';
const GAME_EXE = 'VampireSurvivors.exe';
const STEAM_APP_ID = '1794680';
const MOD_LOADER_URL = 'https://www.nexusmods.com/vampiresurvivors/mods/64';
const MELON_LOADER_URL = 'https://github.com/LavaGang/MelonLoader/releases';

const NEW_EXTS = [{ extension: '.dll', destination: 'Mods' }, { extension: '.ttf', destination: 'UserData' }, { extension: '.json', destination: 'UserData' }, { extension: '.xml', destination: 'UserData' }, { extension: '.cfg', destination: 'UserData' }];
const OLD_EXTS = [{ extension: '.js', destination: '' }];
const OLD_HIER_LOADER = 'resources/app/.webpack/renderer/mod_loader/mods';
const OLD_HIER_BASE = 'resources/app/.webpack/renderer/assets';

let CONTEXT_API;
let DISCOVERY_PATH;

const winapi = require('winapi-bindings');
const { fs, util, log } = require('vortex-api');
const vortex_api = require('vortex-api');
const path = require('path');

/**
 * Registers the game with the provided context.
 * @param {Object} context - The context object.
 */
function registerGame(context) {
  CONTEXT_API = context.api;
  context.registerGame({
    id: GAME_ID,
    name: GAME_NAME,
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => '',
    logo: 'gameart.jpg',
    executable: () => GAME_EXE,
    requiredFiles: [GAME_EXE],
    setup: prepareForModding,
    environment: { SteamAPPId: STEAM_APP_ID },
    details: { steamAppId: STEAM_APP_ID },
  });
}

/**
 * Registers installers for the Vampire Survivors Support module.
 * 
 * @param {Object} context - The context object.
 */
function registerInstallers(context) {
  context.registerInstaller('vampiresurvivors-oldengine-mod', 25, testSupportedContentOldEngine, installContentOldEngine);
  context.registerInstaller('vampiresurvivors-newengine-mod', 25, testSupportedContentNewEngine, installContentNewEngine);
}

/**
 * Sets up event listeners for the application.
 *
 * @param {Object} context - The context object.
 */
function setupEventListeners(context) {
  try {
    context.api.events.on('did-install-mod', async (gameId, archiveId, modId) => await onDidInstallMod(gameId, archiveId, modId, context));
  } catch { }
}

/**
 * The main function of the application.
 * 
 * @param {Object} context - The application context.
 * @returns {boolean} - Returns true if the function executed successfully.
 */
function main(context) {
  registerGame(context);
  registerInstallers(context);
  setupEventListeners(context);
  return true;
}

/**
 * Finds the game path for the specified Steam app ID.
 * @returns {Promise<string>} The game path.
 * @throws {Error} If the game installation path is not found.
 */
async function findGame() {
  try {
    const game = await util.steam.findByAppId([STEAM_APP_ID]);
    return game.gamePath;
  } catch {
    const registryKey = 'SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App ' + STEAM_APP_ID;
    const instPath = winapi.RegGetValue('HKEY_LOCAL_MACHINE', registryKey, 'InstallLocation');
    if (!instPath) {
      log('error', `[find-game] game path not found`);
      throw new Error('Game installation path not found.');
    }
    return instPath.value;
  }
}

/**
 * Prepares for modding by setting the DISCOVERY_PATH and checking the engine version.
 * @param {string} discovery - The discovery path.
 * @returns {Promise} A promise that resolves when the modding setup is ensured.
 */
async function prepareForModding(discovery) {
  DISCOVERY_PATH = discovery;
  const isNewEngine = await checkEngineVersion(discovery);
  const modLoaderPath = isNewEngine ? path.join(discovery.path, 'MelonLoader') : path.join(discovery.path, 'resources', 'app', '.webpack', 'renderer', 'mod_loader', 'mods');
  return ensureModdingSetup(modLoaderPath, isNewEngine);
}

/**
 * Checks the engine version by verifying the existence of UnityCrashHandler64.exe file.
 * @param {Object} discovery - The discovery object containing the path to check.
 * @returns {Promise<boolean>} - A promise that resolves to true if the engine version is valid, false otherwise.
 */
async function checkEngineVersion(discovery) {
  const enginePath = path.join(discovery.path, 'UnityCrashHandler64.exe');
  try {
    await fs.statAsync(enginePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures the modding setup by checking for the existence of a mod loader path.
 * If the mod loader path exists, it checks for either MelonLoader or ModLoader based on the engine version.
 * 
 * @param {string} modLoaderPath - The path to the mod loader.
 * @param {boolean} isNewEngine - Indicates whether the engine version is new or not.
 * @returns {Promise} - A promise that resolves with the result of the mod loader check.
 * @throws {Error} - If there is an error during the modding setup.
 */
async function ensureModdingSetup(modLoaderPath, isNewEngine) {
  try {
    await fs.ensureDirWritableAsync(modLoaderPath);
    return isNewEngine ? checkForMelonLoader(modLoaderPath) : checkForModLoader(modLoaderPath);
  } catch (error) {
    log('error', '[mod-setup] failed to ensure modding setup:', error);
    throw error;
  }
}

/**
 * Checks for the existence of the VS Mod Loader.
 * @param {string} modLoaderPath - The path to the mod loader.
 * @returns {boolean} - Returns true if VS Mod Loader exists, false otherwise.
 */
function checkForModLoader(modLoaderPath) {
  return checkExistence(modLoaderPath, 'ModLoader', MOD_LOADER_URL);
}

/**
 * Checks for the existence of MelonLoader.
 * @param {string} melonLoaderPath - The path to the MelonLoader.
 * @returns {boolean} - Returns true if MelonLoader exists, false otherwise.
 */
function checkForMelonLoader(melonLoaderPath) {
  return checkExistence(melonLoaderPath, 'MelonLoader', MELON_LOADER_URL);
}

/**
 * Checks the existence of a loader at the specified path.
 * If the loader does not exist, it logs an info message and sends a notification.
 *
 * @param {string} path - The path to the loader.
 * @param {string} loaderName - The name of the loader.
 * @param {string} downloadUrl - The URL to download the loader.
 * @returns {Promise<void>} - A promise that resolves when the existence check is complete.
 */
async function checkExistence(path, loaderName, downloadUrl) {
  try {
    await fs.statAsync(path);
  } catch {
    log('info', `[check-loader] ${loaderName.toLowerCase()}-missing`);
    CONTEXT_API.sendNotification({
      id: `${loaderName.toLowerCase()}-missing`,
      type: 'warning',
      title: `${loaderName} not found`,
      message: `${loaderName} is necessary for modding. Please install it.`,
      actions: [{ title: `Get ${loaderName}`, action: () => util.opn(downloadUrl).catch(() => undefined) }],
    });
  }
}

/**
 * Checks if the provided files are supported by the old game engine.
 * @param {string[]} files - An array of file paths.
 * @param {string} gameId - The ID of the game.
 * @param {string} modPath - The path of where the mod is being installed.
 * @returns {Promise<{ supported: boolean, requiredFiles: string[] }>} - An object containing the supported state and required files.
 */
async function testSupportedContentOldEngine(files, gameId, modPath) {
  const isNewEngine = await checkEngineVersion(DISCOVERY_PATH);
  let supported = gameId === GAME_ID && files.some(file => OLD_EXTS.some(ext => path.extname(file).toLowerCase() === ext.extension));
  if (supported === false && files.some(file => file.replaceAll('\\', '/').includes('renderer/') || file.replaceAll('\\', '/').includes('assets/')))
    supported = true;
  if (supported && isNewEngine) {
    CONTEXT_API.sendNotification({
      id: `is_new_engine_${(path.parse(path.basename(modPath)).name).toLowerCase()}`,
      type: 'warning',
      title: `Old Mod but New Engine [${path.parse(path.basename(modPath)).name}]`,
      message: 'You are trying to install a Mod for the Old Engine on the New Engine',
    });
  }
  log('info', `[old-e] supported state: ${supported}`);
  return { supported, requiredFiles: [] };
}

/**
 * Checks if the provided files are supported by the new game engine.
 * @param {string[]} files - An array of file paths.
 * @param {string} gameId - The ID of the game.
 * @param {string} modPath - The path of where the mod is being installed.
 * @returns {Promise<{ supported: boolean, requiredFiles: string[] }>} - An object containing the supported state and required files.
 */
async function testSupportedContentNewEngine(files, gameId, modPath) {
  const isNewEngine = await checkEngineVersion(DISCOVERY_PATH);
  const supported = gameId === GAME_ID && files.some(file => NEW_EXTS.some(ext => path.extname(file).toLowerCase() === ext.extension));
  if (supported && !isNewEngine) {
    CONTEXT_API.sendNotification({
      id: `is_old_engine${(path.parse(path.basename(modPath)).name).toLowerCase()}`,
      type: 'warning',
      title: `New Mod but Old Engine [${path.parse(path.basename(modPath)).name}]`,
      message: 'You are trying to install a Mod for the new Engine on the Old Engine',
    });
  }
  log('info', `[new-e] supported state: ${supported}`);
  return { supported, requiredFiles: [] };
}

/**
 * Installs content using for the old engine.
 * 
 * @param {Array} files - The files to be installed.
 * @returns {Promise} - A promise that resolves when the content is installed.
 */
async function installContentOldEngine(files) {
  files = prepareFilesOldEngine(files);
  return installContent(files);
}

/**
 * Prepares files for the old engine.
 *
 * @param {string[]} files - The array of files to be prepared.
 * @returns {Object[]} - The array of prepared files, each containing a source and destination path.
 */
function prepareFilesOldEngine(files) {
  const preparedFiles = [];
  log('info', `[old-e] prepare files:"${files}"`);

  const hierComponentsLoader = OLD_HIER_LOADER.split('/');
  const hierComponentsBase = OLD_HIER_BASE.split('/');
  let modPathPre = '';
  for (let file of files) {
    file = file.replaceAll('\\', '/');
    const fileComponents = file.split('/');
    let hierIndex = hierComponentsLoader.indexOf(fileComponents[0]);

    if (hierIndex === -1) {
      hierIndex = hierComponentsBase.indexOf(fileComponents[0]);
      if (hierIndex !== -1) {
        modPathPre = hierComponentsBase.slice(0, hierIndex).join('/');
        break;
      }
    } else {
      modPathPre = hierComponentsLoader.slice(0, hierIndex).join('/');
      break;
    }
  }
  if (modPathPre && modPathPre.length !== 0)
    modPathPre += '/';

  for (let file of files) {
    file = file.replaceAll('\\', '/');
    if (file.endsWith('/'))
      continue;
    // const extension = path.extname(file).toLowerCase();
    // const matchingConfig = OLD_EXTS.find(config => config.extension === extension);
    // if (matchingConfig) {
    preparedFiles.push({ source: file, destination: `${modPathPre}${file}` });
    // }
  }

  let logString = '';
  for (const file of preparedFiles) {
    logString += `(source:${file.source}|destination:${file.destination})`;
  }
  log('info', `[old-e] prepared files:"${logString}"`);

  return preparedFiles;
}

/**
 * Installs content using for the new engine.
 * @param {Array} files - The files to be installed.
 * @returns {Promise} - A promise that resolves when the content is installed.
 */
async function installContentNewEngine(files) {
  files = prepareFilesNewEngine(files);
  return installContent(files);
}

/**
 * Prepares files for the new engine.
 * 
 * @param {string[]} files - An array of files to be prepared.
 * @returns {Object[]} - An array of prepared files, each containing a source and destination path.
 */
function prepareFilesNewEngine(files) {
  const preparedFiles = [];
  log('info', `[new-e] prepare files:"${files}"`);

  let hasFolder = false;
  for (let file of files) {
    file = file.replace(/\\/g, "/");
    const dirName = path.dirname(file);
    if (dirName !== '.' && dirName !== '') {
      hasFolder = true;
      break;
    }
  }

  for (let file of files) {
    file = file.replace(/\\/g, '/');
    if (file.endsWith('/'))
      continue;
    const dirName = path.dirname(file);
    const extension = path.extname(file).toLowerCase();
    const matchingConfig = NEW_EXTS.find(config => config.extension === extension);
    if (matchingConfig) {
      if (hasFolder === false && (dirName === '.' || dirName === '')) {
        const newFilePath = path.join(matchingConfig.destination, path.basename(file));
        preparedFiles.push({ source: file, destination: newFilePath });
        continue;
      } else {
        preparedFiles.push({ source: file, destination: file });
      }
    }
  }

  let logString = '';
  for (const file of preparedFiles) {
    logString += `{source:${file.source},destination:${file.destination}}`;
  }
  log('info', `[new-e] prepared files:"${logString}"`);

  return preparedFiles;
}

/**
 * Installs content by copying files from source to destination.
 * @param {Array<Object>} files - An array of file objects containing source and destination paths.
 * @returns {Object} - An object containing the instructions for copying the files.
 */
async function installContent(files) {
  log('info', `[install] files:"${files.map(file => file.source)}"`);
  const instructions = [];

  for (const file of files) {
    instructions.push({
      type: "copy",
      source: file.source,
      destination: file.destination
    });
  }

  for (const file of instructions) {
    log('info', `[instructions] source:"${file.source}" | destination:"${file.destination}"`);
  }
  return { instructions };
}

/**
 * Handles the event when a mod is installed.
 * When on old engine, it fixes the mod by editing the main mod file, if necessary.
 *
 * @param {string} gameId - The ID of the game.
 * @param {string} archiveId - The ID of the mod archive.
 * @param {string} modId - The ID of the mod.
 * @param {Object} context - The context object containing the API and state.
 * @returns {Promise} - A promise that resolves when the function completes.
 */
async function onDidInstallMod(gameId, archiveId, modId, context) {
  const state = context.api.getState();
  const installPath = vortex_api.selectors.installPathForGame(state, gameId);
  const mod = state.persistent.mods?.[gameId]?.[modId];
  if (!installPath || !mod?.installationPath) {
    return;
  }

  // const isNewEngine = await checkEngineVersion(DISCOVERY_PATH);
  // if (isNewEngine)
  // return;

  log('info', `[old-e] fixing old mod:"${modId}" on path:"${mod.installationPath}"`);
  const mainModPath = findMainModFile(path.join(installPath, mod.installationPath));
  if (mainModPath) {
    const success = fixGetMods(mainModPath);
    if (success) {
      log('info', `[old-e] fixed old mod:"${modId}"`);
      context.api.sendNotification({
        id: `fix_success_${modId}`,
        type: 'info',
        title: 'Fixed Mod',
        message: `Successfully fixed Mod: "${modId}"`,
      });
    }
  }
}

/**
 * Fixes a mods getMods function by removing the line that makes it fail.
 * @param {string} filePath - The path to the mods main file.
 * @returns {boolean} - Whether the fix was successful or not.
 */
function fixGetMods(filePath) {
  try {
    log('info', `[fix-get-mods] filePath:"${filePath}"`);
    let data = fs.readFileSync(filePath, "utf8");

    const getModsRegex = /getMods\s*\(\)\s*{([\s\S]*?)}/;
    const readdirSyncRegex = /"mods\/"\),\s*{\s*withFileTypes:\s*true\s*}/;

    const getModsMatch = data.match(getModsRegex);
    if (!getModsMatch) return false;

    const readdirSyncMatch = getModsMatch[0].match(readdirSyncRegex);
    if (!readdirSyncMatch) return false;

    const modifiedData = data.replace(readdirSyncRegex, `${readdirSyncMatch[0]}).filter((dir) => dir.name !== "__folder_managed_by_vortex"`);

    fs.writeFileSync(filePath, modifiedData, "utf8");
    return true;
  } catch (err) {
    log('error', `could not fix mod:"${err}"`);
    return false;
  }
}

/**
 * Finds the main mod file in the specified mod path. For old engine mods.
 * @param {string} modPath - The path to the mod.
 * @returns {string|undefined} - The path to the main mod file, or undefined if not found.
 */
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
        const fileName = dirname + '.js';
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
  } catch {
    return;
  }
}

/**
 * Recursively searches for the "mods" folder within the given folder path. For old engine mods.
 * @param {string} folderPath - The path of the folder to search in.
 * @returns {string|undefined} - The path of the "mods" folder if found, otherwise undefined.
 */
function findModsFolder(folderPath) {
  try {
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        if (file === 'mods') {
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
  } catch {
    return;
  }
}

module.exports = {
  default: main,
};
