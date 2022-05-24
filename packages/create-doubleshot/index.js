#!/usr/bin/env node

// @ts-check
const fs = require('fs')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2), { string: ['_'] })
const prompts = require('prompts')
const {
  green,
  cyan,
  lightRed,
  red,
  reset,
} = require('kolorist')

const cwd = process.cwd()

const FRONTEND_FRAMEWORKS = [
  {
    name: 'vue',
    color: green,
  },
  {
    name: 'react',
    color: cyan,
  },
]

const FRONTEND_FRAMEWORKS_ARR = FRONTEND_FRAMEWORKS.map(e => e.name)

const BACKEND_FRAMEWORKS = [
  {
    name: 'nest',
    color: lightRed,
  },
  {
    name: 'egg',
    color: green,
  },
]

const BACKEND_FRAMEWORKS_ARR = BACKEND_FRAMEWORKS.map(e => e.name)

const renameFiles = {
  _gitignore: '.gitignore',
}

async function init() {
  let targetDir = argv._[0]
  const frontend = argv.frontend || argv.f
  const backend = argv.backend || argv.b

  const defaultProjectName = !targetDir
    ? 'doubleshot-project'
    : targetDir.trim().replace(/\/+$/g, '')

  let result = {}

  try {
    result = await prompts(
      [
        {
          type: targetDir ? null : 'text',
          name: 'projectName',
          message: reset('Project name:'),
          initial: defaultProjectName,
          onState: state =>
            (targetDir
            = state.value.trim().replace(/\/+$/g, '') || defaultProjectName),
        },
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'confirm',
          name: 'overwrite',
          message: () =>
            `${targetDir === '.'
              ? 'Current directory'
              : `Target directory "${targetDir}"`
            } is not empty. Remove existing files and continue?`,
        },
        {
          type: (_, { overwrite } = {}) => {
            if (overwrite === false)
              throw new Error(`${red('✖')} Operation cancelled`)

            return null
          },
          name: 'overwriteChecker',
        },
        {
          type: () => (isValidPackageName(targetDir) ? null : 'text'),
          name: 'packageName',
          message: reset('Package name:'),
          initial: () => toValidPackageName(targetDir),
          validate: dir =>
            isValidPackageName(dir) || 'Invalid package.json name',
        },
        {
          type: frontend && FRONTEND_FRAMEWORKS_ARR.includes(frontend) ? null : 'select',
          name: 'frontendFramework',
          message:
            typeof frontend === 'string' && !FRONTEND_FRAMEWORKS_ARR.includes(frontend)
              ? reset(
                `"${frontend}" isn't a valid frontend framework. Please choose from below: `,
              )
              : reset('Select a frontend framework:'),
          initial: 0,
          choices: FRONTEND_FRAMEWORKS.map((framework) => {
            const frameworkColor = framework.color
            return {
              title: frameworkColor(framework.name),
              value: framework.name,
            }
          }),
        },
        {
          type: backend && BACKEND_FRAMEWORKS_ARR.includes(backend) ? null : 'select',
          name: 'backendFramework',
          message: reset('Select a backend framework:'),
          choices: BACKEND_FRAMEWORKS.map((framework) => {
            const frameworkColor = framework.color
            return {
              title: frameworkColor(framework.name),
              value: framework.name,
            }
          }),
        },
      ],
      {
        onCancel: () => {
          throw new Error(`${red('✖')} Operation cancelled`)
        },
      },
    )
  }
  catch (cancelled) {
    console.log(cancelled.message)
    return
  }

  // user choice associated with prompts
  const { overwrite, packageName, frontendFramework, backendFramework } = result

  const root = path.join(cwd, targetDir)

  if (overwrite)
    emptyDir(root)
  else if (!fs.existsSync(root))
    fs.mkdirSync(root, { recursive: true })

  console.log(`\nScaffolding project in ${root}...`)

  const templateDir = path.join(__dirname, `template-${frontendFramework}-${backendFramework}`)

  const write = (file, content) => {
    const targetPath = renameFiles[file]
      ? path.join(root, renameFiles[file])
      : path.join(root, file)
    if (content)
      fs.writeFileSync(targetPath, content)
    else
      copy(path.join(templateDir, file), targetPath)
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter(f => f !== 'package.json'))
    write(file)

  const pkg = require(path.join(templateDir, 'package.json'))

  pkg.name = packageName || targetDir

  write('package.json', JSON.stringify(pkg, null, 2))

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm'

  console.log('\nDone. Now run:\n')
  if (root !== cwd)
    console.log(`  cd ${path.relative(cwd, root)}`)

  switch (pkgManager) {
    case 'yarn':
      console.log('  yarn')
      console.log('  yarn dev')
      break
    default:
      console.log(`  ${pkgManager} install`)
      console.log(`  ${pkgManager} run dev`)
      break
  }
  console.log()
}

function copy(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory())
    copyDir(src, dest)
  else
    fs.copyFileSync(src, dest)
}

function isValidPackageName(projectName) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    projectName,
  )
}

function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

function isEmpty(path) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

function emptyDir(dir) {
  if (!fs.existsSync(dir))
    return

  for (const file of fs.readdirSync(dir)) {
    const abs = path.resolve(dir, file)
    // baseline is Node 12 so can't use rmSync :(
    if (fs.lstatSync(abs).isDirectory()) {
      emptyDir(abs)
      fs.rmdirSync(abs)
    }
    else {
      fs.unlinkSync(abs)
    }
  }
}

/**
 * @param {string | undefined} userAgent process.env.npm_config_user_agent
 * @returns object | undefined
 */
function pkgFromUserAgent(userAgent) {
  if (!userAgent)
    return undefined
  const pkgSpec = userAgent.split(' ')[0]
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  }
}

init().catch((e) => {
  console.error(e)
})
