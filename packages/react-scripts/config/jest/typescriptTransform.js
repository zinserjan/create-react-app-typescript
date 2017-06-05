// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

const fs = require('fs');
const crypto = require('crypto');
const tsc = require('typescript');
const tsconfigPath = require('app-root-path').resolve('/tsconfig.json');
const THIS_FILE = fs.readFileSync(__filename);

let compilerConfig = {
  module: tsc.ModuleKind.CommonJS,
  jsx: tsc.JsxEmit.React,
};

if (fs.existsSync(tsconfigPath)) {
  try {
    const tsconfig = require(tsconfigPath);

    if (tsconfig && tsconfig.compilerOptions) {
      compilerConfig = tsconfig.compilerOptions;
    }
  } catch (e) {
    /* Do nothing - default is set */
  }
}

module.exports = {
  process(src, path, config, options) {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      let compilerOptions = compilerConfig;
      // inline source with source map for remapping coverage
      if (options.instrument) {
        compilerOptions = Object.assign({}, compilerConfig);
        delete compilerOptions.sourceMap;
        compilerOptions.inlineSourceMap = true;
        compilerOptions.inlineSources = true;
      }

      const tsTranspiled = tsc.transpileModule(src, {
        compilerOptions: compilerOptions,
        fileName: path,
      });
      return tsTranspiled.outputText;
    }
    return src;
  },
  getCacheKey(fileData, filePath, configStr, options) {
    return crypto
      .createHash('md5')
      .update(THIS_FILE)
      .update('\0', 'utf8')
      .update(fileData)
      .update('\0', 'utf8')
      .update(filePath)
      .update('\0', 'utf8')
      .update(configStr)
      .update('\0', 'utf8')
      .update(JSON.stringify(compilerConfig))
      .update('\0', 'utf8')
      .update(options.instrument ? 'instrument' : '')
      .digest('hex');
  },
};
