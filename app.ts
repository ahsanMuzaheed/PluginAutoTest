import * as fs from 'fs'
import * as https from 'https'
import * as unzip from 'unzip'
import * as rimraf from 'rimraf'
import * as request from 'request'
import {spawn } from 'child_process'
import * as fsextra from 'fs-extra'

interface AdmobSeting{
    androidAppId:string;
    androidBanner:string;
    androidInterstitial:string;
    androidRewardedVideo:string;

    iosAppId:string;
    iosBanner:string;
    iosInterstitial:string;
    iosRewardedVideo:string;
}

interface AutoTestConfig {
    enginePath:string;
    pluginPath:string;
    pluginName:string;
    demoProject:string;
    demoName:string;
    overrideMinSdkVersion?:number;
    admobSetting?:AdmobSeting;
    useMarketplacePlugin?:boolean;
    demoProject423?:string;
    demoProject424?:string;
    buildAndroid?:boolean;
    buildIOS?:boolean;
}

var autoTestConfig:AutoTestConfig = JSON.parse(fs.readFileSync("./config.json", "utf8") )

function downloadFile(url:string, filePath:string):Promise<Error>{
    return new Promise<Error>((resolve, reject)=>{
        var file = fs.createWriteStream(filePath);
        var r = request(url);

        r.on('response',  function (res) {
            res.pipe(file)
            file.on('finish', ()=>{
                resolve(null)
            }).on('error', (err)=>{
                resolve(err)
            })
        });
    })
}

function unzipFile(zipFile:string, targetPath:string):Promise<void>{
    return new Promise<void>((resolve, reject)=>{
        fs.createReadStream(zipFile).pipe(unzip.Extract({ path:targetPath})).on('close', ()=>{
            resolve();
        });
    })
}


function createDirectory(path:string):Promise<void>{
    return new Promise<void>((resolve, reject)=>{
        if (fs.existsSync(path)){
            rimraf(path, (err)=>{
                if(err != null){
                    reject(err)
                    return;
                }

                fs.mkdirSync(path);
                resolve();
            })
        }
        else{
            fs.mkdirSync(path);
            resolve();
        }
    })
}


function createStdoutFn(title:string){
    return function(data:string){
        console.log(title + ":" + data)
    }
}

function createStderrFn(title:string){
    return function(data:string){
        console.error(title + ":" + data)
    }
}

function copyDirectory(src:string, dst:string):Promise<Error>{
    return new Promise<Error>((resolve, reject)=>{
        fsextra.copy(src, dst, function (err) {
            if (err) {
                resolve(err)
            } else {
                resolve(null)
            }
          });
    })
}

function runCommand(cmd:string, args:string[], stdoutFn?:(data:string)=>any, stderrFn?:(data:string)=>any):Promise<number>{
    return new Promise<number>((resolve, reject)=>{
        var commandObj = spawn( cmd, args);
        commandObj.stdout.on('data',(data) => {
            if(stdoutFn) stdoutFn(data)
        } );
        
        commandObj.stderr.on( 'data', (data) => {
            if(stderrFn) stderrFn(data)
        } );
        
        commandObj.on('close', (code) => {
            resolve(code);
        } );
    })
}

function overrideMinSdkVersion(){
    if(autoTestConfig.overrideMinSdkVersion == null){
        return;
    }

    try{
        var minSdkVersion = autoTestConfig.overrideMinSdkVersion;
        var engineConfigPath = "./tmp/"+autoTestConfig.demoName+"/Config/DefaultEngine.ini"
        var engineConfigContent = fs.readFileSync(engineConfigPath, "utf8");
        if(engineConfigContent.indexOf("MinSDKVersion=") > 0){
            var begin = engineConfigContent.indexOf("MinSDKVersion=")
            var end = engineConfigContent.indexOf("\n", begin)
            
            engineConfigContent = engineConfigContent.substr(0, begin) + "MinSDKVersion="+minSdkVersion+"\r\n" + engineConfigContent.substr(end+1)
            fs.writeFileSync(engineConfigPath, engineConfigContent)
        } else {
            var begin = engineConfigContent.indexOf("[/Script/AndroidRuntimeSettings.AndroidRuntimeSettings]")
            var end = engineConfigContent.indexOf("\n", begin)
            engineConfigContent = engineConfigContent.substr(0, begin) + "[/Script/AndroidRuntimeSettings.AndroidRuntimeSettings]\r\nMinSDKVersion="+minSdkVersion + "\r\n"+ engineConfigContent.substr(end+1)
            fs.writeFileSync(engineConfigPath, engineConfigContent)
        }

    }catch(e){
        return;
    }
}

function overrideAdmobSetting(){
    if(autoTestConfig.admobSetting == null){
        return;
    }

    try {
        var engineConfigPath = "./tmp/"+autoTestConfig.demoName+"/Config/DefaultEngine.ini"
        var engineConfigContent = fs.readFileSync(engineConfigPath, "utf8");
        

        var admobSettingContent = "[/Script/EasyAdsEditor.AdmobSetting]\n";

        // Android
        if(autoTestConfig.admobSetting.androidAppId != null){
            admobSettingContent += "AndroidAppId=" +autoTestConfig.admobSetting.androidAppId + "\n";
        }
        
        if(autoTestConfig.admobSetting.androidBanner != null){
            admobSettingContent += "AndroidBannerUnit=" +autoTestConfig.admobSetting.androidBanner + "\n";
        }

        if(autoTestConfig.admobSetting.androidInterstitial != null){
            admobSettingContent += "AndroidInterstitialUnit=" +autoTestConfig.admobSetting.androidInterstitial + "\n";
        }

        if(autoTestConfig.admobSetting.androidRewardedVideo != null){
            admobSettingContent += "AndroidRewardedVideoAdUnit=" +autoTestConfig.admobSetting.androidRewardedVideo + "\n";
        }


        // IOS
        if(autoTestConfig.admobSetting.iosAppId != null){
            admobSettingContent += "IOSAppId=" +autoTestConfig.admobSetting.iosAppId + "\n";
        }
        
        if(autoTestConfig.admobSetting.iosBanner != null){
            admobSettingContent += "IOSBannerUnit=" +autoTestConfig.admobSetting.iosBanner + "\n";
        }

        if(autoTestConfig.admobSetting.iosInterstitial != null){
            admobSettingContent += "IOSInterstitialUnit=" +autoTestConfig.admobSetting.iosInterstitial + "\n";
        }

        if(autoTestConfig.admobSetting.iosRewardedVideo != null){
            admobSettingContent += "IOSRewardedVideoAdUnit=" +autoTestConfig.admobSetting.iosRewardedVideo + "\n";
        }

        engineConfigContent += admobSettingContent
        fs.writeFileSync(engineConfigPath, engineConfigContent)
    }catch(e){
        console.log("overrideAdmobSetting fail:" + e)
        return;
    }
}

async function testDownalodDemoProject(){

    if(autoTestConfig.useMarketplacePlugin){
        autoTestConfig.pluginPath = autoTestConfig.enginePath + "/Engine/Plugins/Marketplace";
    }

    if(autoTestConfig.enginePath == null || autoTestConfig.enginePath.lastIndexOf("UE_") < 0){
        console.log("please fill the correct engine path in config.json")
        process.exit(1)
    }

    var index = autoTestConfig.enginePath.lastIndexOf("UE_")
    var engineVersion = autoTestConfig.enginePath.substring(index+3)
    console.log("find the engine version:"+engineVersion)

    if(engineVersion == "4.23"){
        if(autoTestConfig.demoProject423 != null && autoTestConfig.demoProject423.length > 0){
            autoTestConfig.demoProject = autoTestConfig.demoProject423;
            console.log("use 4.23 demoproject:" + autoTestConfig.demoProject423)
        }
    } else if(engineVersion == "4.24"){
        if(autoTestConfig.demoProject424 != null && autoTestConfig.demoProject424.length > 0){
            autoTestConfig.demoProject = autoTestConfig.demoProject424;
            console.log("use 4.24 demoproject:" + autoTestConfig.demoProject424)
        }
    } else {
        console.log("unsupported engine version:" + engineVersion)
        process.exit(1)
    }

    await createDirectory("./tmp")
    await downloadFile(autoTestConfig.demoProject, "./tmp/testProject.zip")
    await unzipFile("./tmp/testProject.zip", "./tmp/")
    await createDirectory("./tmp/"+ autoTestConfig.demoName+"/Plugins/");
    await createDirectory("./tmp/"+ autoTestConfig.demoName+"/Plugins/"+autoTestConfig.pluginName)
    overrideMinSdkVersion();
    overrideAdmobSetting();
    
    var err = await copyDirectory(autoTestConfig.pluginPath + "/" + autoTestConfig.pluginName, "./tmp/"+ autoTestConfig.demoName + "/Plugins/"+autoTestConfig.pluginName);
    
    var cwd = process.cwd();

    var buildEditorArgs = "Development,Win64,-Project="+cwd+"/tmp/"+autoTestConfig.demoName + "/"+autoTestConfig.demoName+".uproject,-TargetType=Editor,-Progress,-NoHotReloadFromIDE";
    var buildEditorCode = await runCommand(autoTestConfig.enginePath+"/Engine/Binaries/DotNET/UnrealBuildTool.exe", buildEditorArgs.split(","), createStdoutFn("build"), createStderrFn("builderror") )
    if(buildEditorCode != 0){
        process.exit(code)
    }

    if(autoTestConfig.buildAndroid){
        var strArgs = "-ScriptsForProject="+cwd+"/tmp/"+autoTestConfig.demoName + "/"+autoTestConfig.demoName+".uproject,BuildCookRun,-nocompile,-nocompileeditor,-installed,-nop4,-project="+cwd + "/tmp/"+ autoTestConfig.demoName+"/"+ autoTestConfig.demoName+ ".uproject,-cook,-stage,-archive,-archivedirectory="+cwd + "/tmp/"+ autoTestConfig.demoName+",-package,-clientconfig=Shipping,-clean,-pak,-prereqs,-distribution,-nodebuginfo,-targetplatform=Android,-cookflavor=ETC1,-build,-utf8output"
        var code = await runCommand(autoTestConfig.enginePath+"/Engine/Binaries/DotNET/AutomationTool.exe", strArgs.split(","), createStdoutFn("build"), createStderrFn("builderror") )
    }
    
    if(autoTestConfig.buildIOS){
        var strIOSArgs = "-ScriptsForProject="+cwd+"/tmp/"+autoTestConfig.demoName + "/"+autoTestConfig.demoName+".uproject,BuildCookRun,-nocompile,-nocompileeditor,-installed,-nop4,-project="+cwd + "/tmp/"+ autoTestConfig.demoName+"/"+ autoTestConfig.demoName+ ".uproject,-cook,-stage,-archive,-archivedirectory="+cwd + "/tmp/"+ autoTestConfig.demoName+",-package,-clientconfig=Shipping,-clean,-pak,-prereqs,-distribution,-nodebuginfo,-targetplatform=IOS,-build,-utf8output"
        code = await runCommand(autoTestConfig.enginePath+"/Engine/Binaries/DotNET/AutomationTool.exe", strIOSArgs.split(","), createStdoutFn("build"), createStderrFn("builderror") )
    }
        
    process.exit(code)
}

testDownalodDemoProject();

