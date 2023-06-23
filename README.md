# Vampire Survivors Support for [Vortex﻿](https://www.nexusmods.com/about/vortex/)

## Description

This extension adds support for Vampire Survivors to [Vortex Mod Manager﻿](https://www.nexusmods.com/about/vortex/), enabling you to easily automate installation of mods for Vampire Survivors without having to worry about where the files are supposed to go, etc.

### At this time following mod types are supported:
- Mods that are designed for the [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64) by Kekos and use the right file structure (e.g resources/app/.webpack/.../img.jpg)
- Other Mods that use the right file structure (e.g resources/app/.webpack/.../img.jpg)

Note that mods that change the same file and **DON'T** use the [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64) will **NOT WORK**.
Mods that only contain the file to change also won't work.

## How to install

This extension requires Vortex. To install, click the Vortex button at the top of the page to open this extension within Vortex, and then click Install. Alternatively, within Vortex, go to the Extensions tab, click "Find More" at the bottom of the tab, search for "Vampire Survivors Support" and then click Install.

You can also manually install it by downloading the main file and dragging it into the "drop zone" labelled "Drop File(s)" in the Extensions tab at the bottom right.

Afterwards, restart Vortex and you can begin installing supported Vampire Survivors mods with Vortex.

## How to make my Mod compatible with this Extension

To make your mod compatible you either need to make your mod compatible with the [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64), or you use the right file structure for your mod. Note though that if you do the latter, mods that try to change the same file will overwrite yours, so it is recommended to use the [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64).

Vampire Survivors is structured like this (most basic representation):
```
﻿/Vampire Survivors
|--> VampireSurvivors.exe
  |--> resources
﻿    |--> app
﻿﻿      |--> .webpack
﻿﻿        ﻿|--> renderer
﻿﻿﻿﻿          |--> index.html
﻿﻿﻿﻿          |--> main.bundle.js
          ﻿﻿﻿﻿|--> mod_loader (only if you installed VS ModLoader)
﻿﻿﻿﻿﻿            |--> mods
              ﻿﻿﻿﻿﻿﻿|--> your mod
﻿﻿﻿﻿          |--> assets
﻿﻿﻿﻿﻿            |--> img
﻿﻿﻿﻿﻿            |--> sfx
﻿﻿﻿﻿﻿            |--> tilesets
```

So if you use the VS ModLoader your file structure always looks like this:
﻿`resources/app/.webpack/renderer/mod_loaders/mods/[your mod name]`

If you don't use the VS ModLoader your file structure can vary but should always contain every folder before your file until resources is reached. An example for the UI.png file:
﻿`resources/app/.webpack/renderer/assets/img/UI.png`

 Note that the [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64)
 only works if another mod is actually active / installed
