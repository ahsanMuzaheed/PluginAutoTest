# PluginAutoTest
this project is help people to know if the EasyAds can package success on the PC and what is the error.
People use the plugin EasyAds(https://www.unrealengine.com/marketplace/en-US/slug/ada7fb755f4541a685b497b6de0d0163), and 
some of those people get various errors.

# How to Use

## 1. install EasyAds plugin
   you can install the plugin in epic marketplace(https://www.unrealengine.com/marketplace/en-US/slug/ada7fb755f4541a685b497b6de0d0163).

## 2. install nodejs
 to install nodejs on your windows, go here(https://nodejs.org/en/) download the nodejs package and install.
 
## 3. change engine path
 change the engine path in the config.json:
  change "D:\\Program Files\\Epic Games\\UE_4.23" to your engine path.
  
## 4. run command to test
   open a console window(cmd.exe), then run the command: node app.js
   it will automatic download the demoproject and copy the plugin to package for android.
   after finish the package, u can find if it package success, and the demoproject is under the tmp/ folder.
