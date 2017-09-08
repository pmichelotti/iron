'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var path = require('path');
var fs = require('fs');
var shell = require('shelljs');
var getInstalledPath = require('get-installed-path');
var pathToProjectRoot = require('./pathToProjectRoot');

var fixPath = function fixPath(pathString) {
    return path.resolve(path.normalize(pathString));
};

var readDir = function readDir(path) {

    var dir = fs.readdirSync(path).filter(function (dir) {
        // return true if `dir` does not start with a `.`
        // to avoid dotfiles causing ENOTDIR (not a directory) errors
        return !dir.match(/^\.[\w -]/);
    });

    return dir;
};

function buildTemplatesObject() {

    var templates = {};
    var ironRc = require('rc')('iron');

    var ironPath = getInstalledPath.sync('iron-fe');

    var templateTypesList = readDir(ironPath + "/lib/templates/");
    templates = makeTemplateObjects(templates, templateTypesList, ironPath + "/lib/templates/");

    if (ironRc.templateConfigs) {
        if (ironRc.templateConfigs.customTemplates) {
            pathToProjectRoot();
            templateTypesList = readDir(ironRc.templateConfigs.customTemplatesPath + "/");
            var customTemplates = makeTemplateObjects(templates, templateTypesList, ironRc.templateConfigs.customTemplatesPath + "/");

            templates = _extends({}, templates, customTemplates);
        }
    }

    return templates;
};

function makeTemplateObjects(templates, templateTypesList, basePath) {

    var upatedTemplates = _extends({}, templates);

    for (var i = 0; i < templateTypesList.length; i++) {

        /*
         * Example bundles, clientlibs, components, project
         */
        var currentTemplateTypeToBePassed = templateTypesList[i];

        (function (templateType) {

            var templatesList = readDir(basePath + templateType);
            upatedTemplates[templateType] = _extends({}, upatedTemplates[templateType]);
            var currentTemplateType = upatedTemplates[templateType];

            for (var z = 0; z < templatesList.length; z++) {

                var currentTemplateToBePassed = templatesList[z];

                (function (templateRaw, type) {

                    var templateName = templateRaw.split(".").splice(0, 1)[0];
                    var templatePath = fixPath(basePath + type + "/" + templateRaw);
                    var templateType = templateRaw.split(".").splice(1, 1)[0];

                    var template = {
                        path: templatePath,
                        type: templateType,
                        name: templateName,
                        value: fs.readFileSync(templatePath).toString()
                    };

                    if (currentTemplateType[templateType] !== undefined) {
                        currentTemplateType[templateType][templateName] = template;
                    } else {
                        currentTemplateType[templateType] = {};
                        currentTemplateType[templateType][templateName] = template;
                    }
                })(currentTemplateToBePassed, templateType);
            }
        })(currentTemplateTypeToBePassed);
    }

    return upatedTemplates;
}

module.exports = buildTemplatesObject;