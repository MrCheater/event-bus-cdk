import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { sync as rimraf } from 'rimraf'
import archiver from 'archiver'

const monorepoDir = path.join(__dirname, '..', '..', '..')

console.log(monorepoDir)

const lambdasRootDir = path.join(monorepoDir, 'lambdas')
const bundledLambdasDir = path.join(monorepoDir, '.lambdas')

const assetsDirectories = fs
  .readdirSync(lambdasRootDir)
  .map(pathname => path.join(lambdasRootDir, pathname))
  .filter(pathname => fs.lstatSync(pathname).isDirectory)
  .filter(pathname => fs.existsSync(path.join(pathname, 'package.json')))

const safeName = name => `${name.replace(/@/, '').replace(/[/|\\]/g, '-')}.zip`

const clean = directory => {
  rimraf(path.join(directory, 'node_modules'))
  rimraf(path.join(directory, 'package-lock.json'))
}

const buildLambda = directory =>
  new Promise((resolve, reject) => {
    execSync(`npm install --only=production`, {
      cwd: directory,
      stdio: 'inherit'
    })

    const output = fs.createWriteStream(
      path.join(bundledLambdasDir, safeName(directory.substr(lambdasRootDir.length + 1)))
    )

    const archive = archiver('zip', {
      zlib: {
        level: 9
      }
    })

    output.on('close', resolve)
    archive.on('error', reject)

    archive.pipe(output)
    archive.directory(directory, false)
    archive.finalize()
  })

const main = async () => {
  try {
    rimraf(bundledLambdasDir)
    fs.mkdirSync(bundledLambdasDir)

    for (const directory of assetsDirectories) {
      clean(directory)

      await buildLambda(directory)
    }
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

export default main
