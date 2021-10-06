var JavaScriptObfuscator = require('javascript-obfuscator');
var fs = require('fs');

var script = fs.readFileSync('./dist/videojs-anti-pirate.min.js', 'utf8')
var obfuscationResult = JavaScriptObfuscator.obfuscate(script, {
    compact: true,
    controlFlowFlattening: false,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: true,
    debugProtectionInterval: false,
    disableConsoleOutput: true,
    domainLock: [],
    forceTransformStrings: [],
    identifierNamesGenerator: 'hexadecimal',
    identifiersDictionary: [],
    identifiersPrefix: '',
    inputFileName: '',
    log: false,
    numbersToExpressions: false,
    optionsPreset: 'default',
    renameGlobals: false,
    renameProperties: false,
    reservedNames: [],
    reservedStrings: [],
    rotateStringArray: true,
    seed: 0,
    selfDefending: false,
    shuffleStringArray: true,
    simplify: true,
    sourceMap: false,
    sourceMapBaseUrl: '',
    sourceMapFileName: '',
    sourceMapMode: 'separate',
    splitStrings: false,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayEncoding: [],
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersType: 'variable',
    stringArrayThreshold: 0.75,
    target: 'browser',
    transformObjectKeys: false,
    unicodeEscapeSequence: false
});
fs.writeFileSync('./dist/videojs-anti-pirate.dist.js', obfuscationResult)