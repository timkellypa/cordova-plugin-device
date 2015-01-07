/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var argscheck = require('cordova/argscheck'),
    channel = require('cordova/channel'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec'),
    cordova = require('cordova');

channel.createSticky('onCordovaInfoReady');
// Tell cordova channel to wait on the CordovaInfoReady event
channel.waitForInitialization('onCordovaInfoReady');

/**
 * This represents the mobile device, and provides properties for inspecting the model, version, UUID of the
 * phone, etc.
 * @constructor
 */
function Device() {
    this.available = false;
    this.platform = null;
    this.version = null;
    this.uuid = null;
    this.cordova = null;
    this.model = null;

    var me = this;

    var DPIByModelIOS = {
        // iPhone
        "iPhone1,default": 163,
        "iPhone2,default": 163,
        "iPhone3,default": 163,
        "iPhone4,default": 326,
        "iPhone4,default": 326,
        "iPhone5,default": 326,
        "iPhone6,default": 326,
        "iPhone7,1": 401,
        "iPhone7,2": 326,
        "iPhone7,default": 326,

        // iPod
        "iPod1,default": 163,
        "iPod2,default": 163,
        "iPod3,default": 163,
        "iPod4,default": 326,
        "iPod5,default": 326,

        // iPad
        "iPad1,default": 132,
        "iPad2,default": 132,
        "iPad3,default": 264,
        "iPad4,default": 264,
        "iPad5,default": 264,

        // iPad Mini
        "iPad2,5": 163,
        "iPad2,6": 163,
        "iPad2,7": 163,
        "iPad4,4": 326,
        "iPad4,5": 326,
        "iPad4,6": 326,
        "iPad4,7": 326,
        "iPad4,8": 326,
        "iPad4,9": 326,

        // 326 is a safe guess if we don't know the device and it is iOS, I suppose.
        "default": 326
    };

    getIOSDPI = function (info) {
        if (typeof (DPIByModelIOS[info.model]) !== "undefined")
            return DPIByModelIOS[info.model];
        else if (typeof (DPIByModelIOS[info.model.split(",")[0] + ",default"]) !== "undefined")
            return DPIByModelIOS[info.model.split(",")[0] + ",default"];
        else
            return DPIByModelIOS["default"];
    }

    /**
     * Get DPI from our available device info.
     *  Specifics:
     *      - Android:  Will return xdpi and ydpi, based on native calculation.
     *      - iOS:  Will return value from key-value pair of model struct (above).
     *      - Else:  Will return 96, normal browser CSS pixel per inch.
     */
    var getDPI = function (info) {
        var x = "";

        // Special case, iOS.  Figure out the dpi by trying our case statements/defaults.
        //      No need to use native module, because it is essentially a list based on model number.
        if (info.platform === "iOS") {
            info.dpi = getIOSDPI(info);
        }

        if (info.xdpi && info.ydpi)
            return { xdpi: info.xdpi, ydpi: info.ydpi };
        else if (info.dpi)
            return { xdpi: info.dpi, ydpi: info.dpi };
        else
            return { xdpi: 96, ydpi: 96 };
    };

    channel.onCordovaReady.subscribe(function () {
        me.getInfo(function (info) {
            //ignoring info.cordova returning from native, we should use value from cordova.version defined in cordova.js
            //TODO: CB-5105 native implementations should not return info.cordova
            var buildLabel = cordova.version;
            me.available = true;
            me.platform = info.platform;
            me.version = info.version;
            me.uuid = info.uuid;
            me.cordova = buildLabel;
            me.model = info.model;

            var dpi = getDPI(info);
            me.xdpi = dpi.xdpi;
            me.ydpi = dpi.ydpi;

            channel.onCordovaInfoReady.fire();
        }, function (e) {
            me.available = false;
            utils.alert("[ERROR] Error initializing Cordova: " + e);
        });
    });
}

/**
 * Get device info
 *
 * @param {Function} successCallback The function to call when the heading data is available
 * @param {Function} errorCallback The function to call when there is an error getting the heading data. (OPTIONAL)
 */
Device.prototype.getInfo = function (successCallback, errorCallback) {
    argscheck.checkArgs('fF', 'Device.getInfo', arguments);
    exec(successCallback, errorCallback, "Device", "getDeviceInfo", []);
};

module.exports = new Device();
