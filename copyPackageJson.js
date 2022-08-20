import fs from 'fs';
import util from 'util';
import path from 'path';

const paths = {
    root: path.resolve(),
    sourceFile: path.resolve('package.json'),
    buildFile: path.resolve('build/package.json'),
    sourceDir: 'src',
    buildDir: 'build',
}

const makeRelPath = (absPath) => absPath.startsWith(paths.root) ? absPath.slice(paths.root.length + 1) : absPath
const startsWith = (pathValue, startFolder) =>
    pathValue.startsWith('./' + startFolder + '/') ||
    pathValue.startsWith(startFolder + '/')
const stripStart = (pathValue, startFolder) =>
    pathValue.startsWith('./' + startFolder + '/') ?
        '.' + pathValue.slice(('./' + startFolder).length) :
        pathValue.startsWith(startFolder + '/') ?
            pathValue.slice((startFolder + '/').length) :
            pathValue

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile);

(() => {
    (async () => {
        const {sourceDir, buildDir} = paths
        console.log(' parsing ' + makeRelPath(paths.sourceFile) + ', now writing...')
        const packageJson = await readFile(paths.sourceFile)
        const packageJsonData = JSON.parse(packageJson.toString())
        if(packageJsonData.exports) {
            packageJsonData.exports = Object.keys(packageJsonData.exports).reduce((exp, pkgName) => ({
                ...exp,
                [pkgName]:
                    startsWith(packageJsonData.exports[pkgName], buildDir) ?
                        stripStart(packageJsonData.exports[pkgName], buildDir) :
                        startsWith(packageJsonData.exports[pkgName], sourceDir) ?
                            stripStart(packageJsonData.exports[pkgName], sourceDir) :
                            packageJsonData.exports[pkgName],
            }), packageJsonData.exports)
        }
        if(packageJsonData.main && startsWith(packageJsonData.main, buildDir)) {
            packageJsonData.main = stripStart(packageJsonData.main, buildDir)
        }
        if(packageJsonData.main && startsWith(packageJsonData.main, sourceDir)) {
            packageJsonData.main = stripStart(packageJsonData.main, sourceDir)
        }
        if(packageJsonData.module && startsWith(packageJsonData.module, buildDir)) {
            packageJsonData.module = stripStart(packageJsonData.module, buildDir)
        }
        if(packageJsonData.module && startsWith(packageJsonData.module, sourceDir)) {
            packageJsonData.module = stripStart(packageJsonData.module, sourceDir)
        }
        if(packageJsonData.typings && startsWith(packageJsonData.typings, buildDir)) {
            packageJsonData.typings = stripStart(packageJsonData.typings, buildDir)
        }
        if(packageJsonData.typings && startsWith(packageJsonData.typings, sourceDir)) {
            packageJsonData.typings = stripStart(packageJsonData.typings, sourceDir)
        }
        if(packageJsonData.types && startsWith(packageJsonData.types, buildDir)) {
            packageJsonData.types = stripStart(packageJsonData.types, buildDir)
        }
        if(packageJsonData.types && startsWith(packageJsonData.types, sourceDir)) {
            packageJsonData.types = stripStart(packageJsonData.types, sourceDir)
        }
        console.log(' parsed ' + makeRelPath(paths.sourceFile) + ', now writing ' + makeRelPath(paths.buildFile))
        await writeFile(paths.buildFile, JSON.stringify(packageJsonData, undefined, 4))
        console.log(' parsed & copied ' + makeRelPath(paths.buildFile))
    })()
        .then(() => process.exit())
        .catch((e) => {
            console.error('copyPackageJson failed!', e)
            process.exit(101)
        })
})()
