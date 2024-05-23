[![Vampire Survivors Support Code Documentation](https://img.shields.io/badge/Vampire_Survivors_Support-Code_Documentation-green.svg)](https://der-floh.github.io/Vampire-Survivors-Support-for-Vortex/global.html)

# Vampire Survivors Support for [Vortex](https://www.nexusmods.com/about/vortex/)

## Description

This extension adds support for Vampire Survivors to [Vortex Mod Manager](https://www.nexusmods.com/about/vortex/), enabling you to easily automate installation of mods for Vampire Survivors without having to worry about where the files are supposed to go, etc.

### At this time following mod types are supported:
- Mods that are designed for the [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64) by Kekos and use the right file structure (e.g resources/app/.webpack/.../img.jpg)
- Other Mods that use the right file structure (e.g resources/app/.webpack/.../img.jpg)
- Mods for the New Engine that use the right file structure (e.g Mods/mod.dll)

Note that mods that change the same file and **DON'T** use the [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64) will **NOT WORK**.
Note that mods for the New Engine have to be made for [MelonLoader](https://github.com/LavaGang/MelonLoader/releases)

Mods that only contain the file to change also won't work.

## Currently Supported Mods
### Old Engine:
- [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64)
- [Multiperpose QoL Mod](https://www.nexusmods.com/vampiresurvivors/mods/50)
- [Castlevania Survivors](https://www.nexusmods.com/vampiresurvivors/mods/61)
- [Extendend Power Up Levels](https://www.nexusmods.com/vampiresurvivors/mods/60)
- [Eggs Bulk Buy](https://www.nexusmods.com/vampiresurvivors/mods/63)
- [Movement Speed Cap](https://www.nexusmods.com/vampiresurvivors/mods/65)
- [Tekken 3 Chicken Sound Effect (NO ModLoader)](https://www.nexusmods.com/vampiresurvivors/mods/53)
- [Exorcismus - Unholy Vespers Skin Mod (NO ModLoader)](https://www.nexusmods.com/vampiresurvivors/mods/17)
- [Remove Cat Sounds (NO ModLoader)](https://www.nexusmods.com/vampiresurvivors/mods/19)
- [Forest A audio to Brodyquest (NO ModLoader)](https://www.nexusmods.com/vampiresurvivors/mods/58)
- [Better Lama Armor (NO ModLoader)](https://www.nexusmods.com/vampiresurvivors/mods/80)

### New Engine:
- [VSTweaks (New Engine)](https://www.nexusmods.com/vampiresurvivors/mods/87)
- [Ultra-Wide Fix (NewEngine)](https://www.nexusmods.com/vampiresurvivors/mods/79)

## How to install

This extension requires Vortex. To install, click the Vortex button at the top of the page to open this extension within Vortex, and then click Install. Alternatively, within Vortex, go to the Extensions tab, click "Find More" at the bottom of the tab, search for "Vampire Survivors Support" and then click Install.

You can also manually install it by downloading the main file and dragging it into the "drop zone" labelled "Drop File(s)" in the Extensions tab at the bottom right.

Afterwards, restart Vortex and you can begin installing supported Vampire Survivors mods with Vortex.

## Known Issues

### Old Engine Black Screen:
If you encounter a black screen this is most likely because of 2 reasons.
1. You enabled the VS ModLoader but no other mod. If the VS ModLoader is enabled alone it causes a black screen.
2. You're using one of Kekos mods which have some issues with Vortex files because they try to load Vortex files as mods. These issues could also occur on other mods. To fix this you just need to add the following line into the main mod file (typically called `[modname].js`):
#### UPDATE: This now gets fixed automatically by the Extension uppon installing the Mod
`.filter((dir) => dir.isFile() && dir.name !== "__folder_managed_by_vortex")`

![Kekos-Mod-Error-Previous](https://staticdelivery.nexusmods.com/mods/2295/images/593/593-1716496297-2102395392.png)
![Kekos-Mod-Error-After](https://staticdelivery.nexusmods.com/mods/2295/images/593/593-1716496305-305732697.png)
For the [Multiperpose QoL Mod](https://www.nexusmods.com/vampiresurvivors/mods/50) the file would be `MultipurposeQolMod.js` and for the [Castlevania Survivors](https://www.nexusmods.com/vampiresurvivors/mods/61) Mod it would be `Castlevania.js`

## How to make my Mod compatible with this Extension

### Old Engine:
To make your mod compatible you either need to make your mod compatible with the [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64), or you use the right file structure for your mod. Note though that if you do the latter, mods that try to change the same file will overwrite yours, so it is recommended to use the [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64).

Vampire Survivors is structured like this (most basic representation):
```
/Vampire Survivors
|--> VampireSurvivors.exe
  |--> resources
    |--> app
      |--> .webpack
        |--> renderer
          |--> index.html
          |--> main.bundle.js
          |--> mod_loader (only if you installed VS ModLoader)
            |--> mods
              |--> your mod
          |--> assets
            |--> img
            |--> sfx
            |--> tilesets
```

So if you use the VS ModLoader your file structure always looks like this:
```
|--> resources
  |--> app
    |--> .webpack
      |--> renderer
        |--> mod_loader
          |--> mods
            |--> [your mod]
```

If you don't use the VS ModLoader your file structure can vary but should always contain every folder before your file until resources is reached. An example for the UI.png file:
```
|--> resources
  |--> app
    |--> .webpack
      |--> renderer
        |--> assets
          |--> img
            |--> UI.png
```

Note that the [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64) only works if another mod is actually active / installed

### New Engine
For the New Engine
To make your mod compatible your mod needs to be created for the MelonLoader. If that is the case you just need the right file structure for your mod. All Modfiles go into the Mods folder of MelonLoader. If you access other files within your Mod note that this Extension just copies everything as it is. So a file in `Mods/mod.dll` will be copied to `Mods/mod.dll`. Most of the time you want your files to be in the Mods folder if that is the case your file structure would look like this:
```
|--> Mods
  |--> mod1.dll
  |--> mod2.dll
```

If you have a file for example a font that needs to go in the UserData folder it would look like this;
```
|--> Mods
  |--> mod1.dll
  |--> mod2.dll
|--> UserData
  |--> font.ttf
```

<br/>

[!["Buy me a Floppy Disk"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/der_floh)
