"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var unzip = require("unzip");
var rimraf = require("rimraf");
var request = require("request");
var child_process_1 = require("child_process");
var fsextra = require("fs-extra");
var autoTestConfig = JSON.parse(fs.readFileSync("./config.json", "utf8"));
function downloadFile(url, filePath) {
    return new Promise(function (resolve, reject) {
        var file = fs.createWriteStream(filePath);
        var r = request(url);
        r.on('response', function (res) {
            res.pipe(file);
            file.on('finish', function () {
                resolve(null);
            }).on('error', function (err) {
                resolve(err);
            });
        });
    });
}
function unzipFile(zipFile, targetPath) {
    return new Promise(function (resolve, reject) {
        fs.createReadStream(zipFile).pipe(unzip.Extract({ path: targetPath })).on('close', function () {
            resolve();
        });
    });
}
function createDirectory(path) {
    return new Promise(function (resolve, reject) {
        if (fs.existsSync(path)) {
            rimraf(path, function (err) {
                if (err != null) {
                    reject(err);
                    return;
                }
                fs.mkdirSync(path);
                resolve();
            });
        }
        else {
            fs.mkdirSync(path);
            resolve();
        }
    });
}
function createStdoutFn(title) {
    return function (data) {
        console.log(title + ":" + data);
    };
}
function createStderrFn(title) {
    return function (data) {
        console.error(title + ":" + data);
    };
}
function copyDirectory(src, dst) {
    return new Promise(function (resolve, reject) {
        fsextra.copy(src, dst, function (err) {
            if (err) {
                resolve(err);
            }
            else {
                resolve(null);
            }
        });
    });
}
function runCommand(cmd, args, stdoutFn, stderrFn) {
    return new Promise(function (resolve, reject) {
        var commandObj = child_process_1.spawn(cmd, args);
        commandObj.stdout.on('data', function (data) {
            if (stdoutFn)
                stdoutFn(data);
        });
        commandObj.stderr.on('data', function (data) {
            if (stderrFn)
                stderrFn(data);
        });
        commandObj.on('close', function (code) {
            resolve(code);
        });
    });
}
function overrideMinSdkVersion() {
    if (autoTestConfig.overrideMinSdkVersion == null) {
        return;
    }
    try {
        var minSdkVersion = autoTestConfig.overrideMinSdkVersion;
        var engineConfigPath = "./tmp/" + autoTestConfig.demoName + "/Config/DefaultEngine.ini";
        var engineConfigContent = fs.readFileSync(engineConfigPath, "utf8");
        if (engineConfigContent.indexOf("MinSDKVersion=") > 0) {
            var begin = engineConfigContent.indexOf("MinSDKVersion=");
            var end = engineConfigContent.indexOf("\n", begin);
            engineConfigContent = engineConfigContent.substr(0, begin) + "MinSDKVersion=" + minSdkVersion + "\r\n" + engineConfigContent.substr(end + 1);
            fs.writeFileSync(engineConfigPath, engineConfigContent);
        }
        else {
            var begin = engineConfigContent.indexOf("[/Script/AndroidRuntimeSettings.AndroidRuntimeSettings]");
            var end = engineConfigContent.indexOf("\n", begin);
            engineConfigContent = engineConfigContent.substr(0, begin) + "[/Script/AndroidRuntimeSettings.AndroidRuntimeSettings]\r\nMinSDKVersion=" + minSdkVersion + "\r\n" + engineConfigContent.substr(end + 1);
            fs.writeFileSync(engineConfigPath, engineConfigContent);
        }
    }
    catch (e) {
        return;
    }
}
function overrideAdmobSetting() {
    if (autoTestConfig.admobSetting == null) {
        return;
    }
    try {
        var engineConfigPath = "./tmp/" + autoTestConfig.demoName + "/Config/DefaultEngine.ini";
        var engineConfigContent = fs.readFileSync(engineConfigPath, "utf8");
        var admobSettingContent = "[/Script/EasyAdsEditor.AdmobSetting]\n";
        // Android
        if (autoTestConfig.admobSetting.androidAppId != null) {
            admobSettingContent += "AndroidAppId=" + autoTestConfig.admobSetting.androidAppId + "\n";
        }
        if (autoTestConfig.admobSetting.androidBanner != null) {
            admobSettingContent += "AndroidBannerUnit=" + autoTestConfig.admobSetting.androidBanner + "\n";
        }
        if (autoTestConfig.admobSetting.androidInterstitial != null) {
            admobSettingContent += "AndroidInterstitialUnit=" + autoTestConfig.admobSetting.androidInterstitial + "\n";
        }
        if (autoTestConfig.admobSetting.androidRewardedVideo != null) {
            admobSettingContent += "AndroidRewardedVideoAdUnit=" + autoTestConfig.admobSetting.androidRewardedVideo + "\n";
        }
        // IOS
        if (autoTestConfig.admobSetting.iosAppId != null) {
            admobSettingContent += "IOSAppId=" + autoTestConfig.admobSetting.iosAppId + "\n";
        }
        if (autoTestConfig.admobSetting.iosBanner != null) {
            admobSettingContent += "IOSBannerUnit=" + autoTestConfig.admobSetting.iosBanner + "\n";
        }
        if (autoTestConfig.admobSetting.iosInterstitial != null) {
            admobSettingContent += "IOSInterstitialUnit=" + autoTestConfig.admobSetting.iosInterstitial + "\n";
        }
        if (autoTestConfig.admobSetting.iosRewardedVideo != null) {
            admobSettingContent += "IOSRewardedVideoAdUnit=" + autoTestConfig.admobSetting.iosRewardedVideo + "\n";
        }
        engineConfigContent += admobSettingContent;
        fs.writeFileSync(engineConfigPath, engineConfigContent);
    }
    catch (e) {
        console.log("overrideAdmobSetting fail:" + e);
        return;
    }
}
function testDownalodDemoProject() {
    return __awaiter(this, void 0, void 0, function () {
        var index, engineVersion, err, cwd, buildEditorArgs, buildEditorCode, strArgs, code, strIOSArgs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (autoTestConfig.useMarketplacePlugin) {
                        autoTestConfig.pluginPath = autoTestConfig.enginePath + "/Engine/Plugins/Marketplace";
                    }
                    if (autoTestConfig.enginePath == null || autoTestConfig.enginePath.lastIndexOf("UE_") < 0) {
                        console.log("please fill the correct engine path in config.json");
                        process.exit(1);
                    }
                    index = autoTestConfig.enginePath.lastIndexOf("UE_");
                    engineVersion = autoTestConfig.enginePath.substring(index + 3);
                    console.log("find the engine version:" + engineVersion);
                    if (engineVersion == "4.23") {
                        if (autoTestConfig.demoProject423 != null && autoTestConfig.demoProject423.length > 0) {
                            autoTestConfig.demoProject = autoTestConfig.demoProject423;
                            console.log("use 4.23 demoproject:" + autoTestConfig.demoProject423);
                        }
                    }
                    else if (engineVersion == "4.24") {
                        if (autoTestConfig.demoProject424 != null && autoTestConfig.demoProject424.length > 0) {
                            autoTestConfig.demoProject = autoTestConfig.demoProject424;
                            console.log("use 4.24 demoproject:" + autoTestConfig.demoProject424);
                        }
                    }
                    else {
                        console.log("unsupported engine version:" + engineVersion);
                        process.exit(1);
                    }
                    return [4 /*yield*/, createDirectory("./tmp")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, downloadFile(autoTestConfig.demoProject, "./tmp/testProject.zip")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, unzipFile("./tmp/testProject.zip", "./tmp/")];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, createDirectory("./tmp/" + autoTestConfig.demoName + "/Plugins/")];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, createDirectory("./tmp/" + autoTestConfig.demoName + "/Plugins/" + autoTestConfig.pluginName)];
                case 5:
                    _a.sent();
                    overrideMinSdkVersion();
                    overrideAdmobSetting();
                    return [4 /*yield*/, copyDirectory(autoTestConfig.pluginPath + "/" + autoTestConfig.pluginName, "./tmp/" + autoTestConfig.demoName + "/Plugins/" + autoTestConfig.pluginName)];
                case 6:
                    err = _a.sent();
                    cwd = process.cwd();
                    buildEditorArgs = "Development,Win64,-Project=" + cwd + "/tmp/" + autoTestConfig.demoName + "/" + autoTestConfig.demoName + ".uproject,-TargetType=Editor,-Progress,-NoHotReloadFromIDE";
                    return [4 /*yield*/, runCommand(autoTestConfig.enginePath + "/Engine/Binaries/DotNET/UnrealBuildTool.exe", buildEditorArgs.split(","), createStdoutFn("build"), createStderrFn("builderror"))];
                case 7:
                    buildEditorCode = _a.sent();
                    if (buildEditorCode != 0) {
                        process.exit(code);
                    }
                    if (!autoTestConfig.buildAndroid) return [3 /*break*/, 9];
                    strArgs = "-ScriptsForProject=" + cwd + "/tmp/" + autoTestConfig.demoName + "/" + autoTestConfig.demoName + ".uproject,BuildCookRun,-nocompile,-nocompileeditor,-installed,-nop4,-project=" + cwd + "/tmp/" + autoTestConfig.demoName + "/" + autoTestConfig.demoName + ".uproject,-cook,-stage,-archive,-archivedirectory=" + cwd + "/tmp/" + autoTestConfig.demoName + ",-package,-clientconfig=Shipping,-clean,-pak,-prereqs,-distribution,-nodebuginfo,-targetplatform=Android,-cookflavor=ETC1,-build,-utf8output";
                    return [4 /*yield*/, runCommand(autoTestConfig.enginePath + "/Engine/Binaries/DotNET/AutomationTool.exe", strArgs.split(","), createStdoutFn("build"), createStderrFn("builderror"))];
                case 8:
                    code = _a.sent();
                    _a.label = 9;
                case 9:
                    if (!autoTestConfig.buildIOS) return [3 /*break*/, 11];
                    strIOSArgs = "-ScriptsForProject=" + cwd + "/tmp/" + autoTestConfig.demoName + "/" + autoTestConfig.demoName + ".uproject,BuildCookRun,-nocompile,-nocompileeditor,-installed,-nop4,-project=" + cwd + "/tmp/" + autoTestConfig.demoName + "/" + autoTestConfig.demoName + ".uproject,-cook,-stage,-archive,-archivedirectory=" + cwd + "/tmp/" + autoTestConfig.demoName + ",-package,-clientconfig=Shipping,-clean,-pak,-prereqs,-distribution,-nodebuginfo,-targetplatform=IOS,-build,-utf8output";
                    return [4 /*yield*/, runCommand(autoTestConfig.enginePath + "/Engine/Binaries/DotNET/AutomationTool.exe", strIOSArgs.split(","), createStdoutFn("build"), createStderrFn("builderror"))];
                case 10:
                    code = _a.sent();
                    _a.label = 11;
                case 11:
                    process.exit(code);
                    return [2 /*return*/];
            }
        });
    });
}
testDownalodDemoProject();
//# sourceMappingURL=app.js.map