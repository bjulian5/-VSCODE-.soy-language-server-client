import { IAliasMap, ITemplatePathDescription } from './interfaces';
import vscode = require('vscode');

export function normalizeAliasTemplate (alias: string, template: string): string {
    const truncatedTemplatePath: string = template.substr(template.indexOf('.'));

    return `${alias}${truncatedTemplatePath}`;
}

export function getNamespace (documentText: string): string {
    const namespacePattern: RegExp = /\{namespace\s*([\w\d.]+)/;
    const namespaceMatch = namespacePattern.exec(documentText);

    if (namespaceMatch) {
        return namespaceMatch[1];
    }

    return null;
}

export function getMatchingAlias (template: string, documentText: string): string {
    const aliases: IAliasMap[] = getAliases(documentText);
    const matchablePart: string = template.split('.')[0];
    const matchingNamedAlias: IAliasMap = aliases.find(aliasObj => aliasObj.aliasName === matchablePart);
    let alias: string;

    if (matchingNamedAlias) {
        alias = matchingNamedAlias.alias;
    } else {
        const matchingAlias: IAliasMap = aliases.find(aliasObj => aliasObj.alias.endsWith(matchablePart) && !aliasObj.aliasName);
        alias = matchingAlias && matchingAlias.alias;
    }

    return alias;
}

function getAliases (documentText: string): IAliasMap[] {
    const aliasPattern: RegExp = /\{alias\s*([\w\d.]+)(?:\s*as\s*([\w\d.]+))?/gm;
    const aliases: IAliasMap[] = [];
    let m: RegExpExecArray;

    while (m = aliasPattern.exec(documentText)) {
        const alias = m[1];
        const aliasName = m[2];

        aliases.push({
            alias,
            aliasName
        });
    }

    return aliases;
}

export function createLocation (definitionInfo: ITemplatePathDescription) {
    if (definitionInfo == null || definitionInfo.path == null) { return null; }

    const definitionResource = vscode.Uri.file(definitionInfo.path);
    const pos = new vscode.Position(definitionInfo.line, 1);

    return new vscode.Location(definitionResource, pos);
}
