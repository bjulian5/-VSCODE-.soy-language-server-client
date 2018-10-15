import vscode = require('vscode');
import fg = require('fast-glob');
import path = require('path');
import linenumber = require('linenumber');
import fs = require('fs');
import { TemplatePathMap } from './interfaces';

const excludeFromFileSearch = [
    '!**/node_modules'
]

function getSoyFiles() {
    console.time('files');
    let promises = [];

    vscode.workspace.workspaceFolders.forEach(wsFolder => {
        const soyPathPattern = [
            wsFolder.uri.fsPath,
            '**',
            '*.soy'
        ];

        const globalSoyFilesPath = path.join(...soyPathPattern);

        promises.push(fg.async([globalSoyFilesPath, ...excludeFromFileSearch]));
    });
    console.timeEnd('files');

    return Promise.all(promises);
}

function parseFile(file: string): TemplatePathMap {
    const namespacePattern: RegExp = /\{namespace ([\w\d.]+)/;
    const templatePattern: RegExp = /\{template ([\w\d.]+)/gm;
    const content: string = fs.readFileSync(file, "utf8");
    let templatePathMap: TemplatePathMap = {};
    let m, n;

    if (m = namespacePattern.exec(content)) {
        const namespace = m[1];

        while (n = templatePattern.exec(content)) {
            const lineNr = linenumber(content, n[0]);
            templatePathMap[`${namespace}${n[1]}`] = {
                path: file,
                line: lineNr[0].line - 1
            };
        }
    }

    return templatePathMap;
}

export function parseFiles() : TemplatePathMap {
    let allTemplatePathMaps: TemplatePathMap = {};

    console.time('all');
    getSoyFiles()
        .then(entries => {
            console.time('parse');
            entries.forEach(entry => entry.forEach(e => {
                const parsedData = parseFile(e);
                if (parsedData) {
                    allTemplatePathMaps = Object.assign(
                        allTemplatePathMaps,
                        parsedData
                    );
                }
            }));
            console.timeEnd('parse');
            console.timeEnd('all');
        });

    return allTemplatePathMaps;
}