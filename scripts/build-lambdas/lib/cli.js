"use strict";

exports.__esModule = true;
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _child_process = require("child_process");

var _rimraf = require("rimraf");

var _archiver = _interopRequireDefault(require("archiver"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const monorepoDir = _path.default.join(__dirname, '..', '..', '..');

console.log(monorepoDir);

const lambdasRootDir = _path.default.join(monorepoDir, 'lambdas');

const bundledLambdasDir = _path.default.join(monorepoDir, '.lambdas');

const assetsDirectories = _fs.default.readdirSync(lambdasRootDir).map(pathname => _path.default.join(lambdasRootDir, pathname)).filter(pathname => _fs.default.lstatSync(pathname).isDirectory).filter(pathname => _fs.default.existsSync(_path.default.join(pathname, 'package.json')));

const safeName = name => `${name.replace(/@/, '').replace(/[/|\\]/g, '-')}.zip`;

const clean = directory => {
  (0, _rimraf.sync)(_path.default.join(directory, 'node_modules'));
  (0, _rimraf.sync)(_path.default.join(directory, 'package-lock.json'));
};

const buildLambda = directory => new Promise((resolve, reject) => {
  (0, _child_process.execSync)(`npm install --only=production`, {
    cwd: directory,
    stdio: 'inherit'
  });

  const output = _fs.default.createWriteStream(_path.default.join(bundledLambdasDir, safeName(directory.substr(lambdasRootDir.length + 1))));

  const archive = (0, _archiver.default)('zip', {
    zlib: {
      level: 9
    }
  });
  output.on('close', resolve);
  archive.on('error', reject);
  archive.pipe(output);
  archive.directory(directory, false);
  archive.finalize();
});

const main = async () => {
  try {
    (0, _rimraf.sync)(bundledLambdasDir);

    _fs.default.mkdirSync(bundledLambdasDir);

    for (const directory of assetsDirectories) {
      clean(directory);
      await buildLambda(directory);
      clean(directory);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

var _default = main;
exports.default = _default;
//# sourceMappingURL=cli.js.map