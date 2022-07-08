#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import minimist from 'minimist'
import prompts from 'prompts'
import {
  red,
  reset,
} from 'colorette'
import {
  BACKEND_FRAMEWORKS,
  BACKEND_FRAMEWORKS_ARR,
  FRONTEND_FRAMEWORKS,
  FRONTEND_FRAMEWORKS_ARR,
  RENAME_FILES,
} from './constants'
import type { PromptsResult } from './types'

const argv = minimist(process.argv.slice(2), { string: ['_'] })

const cwd = process.cwd()

async function init() {
  let targetDir = argv._[0]
  const frontend = argv.frontend || argv.f
  const backend = argv.backend || argv.b

  const defaultProjectName = !targetDir
    ? 'doubleshot-project'
    : targetDir.trim().replace(/\/+$/g, '')

  let result: Partial<PromptsResult> = {}

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
          type: (_, answers) => {
            const { overwrite } = answers
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

  const templateDir = path.join(__dirname, `../template-${frontendFramework}-${backendFramework}`)

  const write = (file: string, content?: string) => {
    const targetPath = RENAME_FILES[file]
      ? path.join(root, RENAME_FILES[file])
      : path.join(root, file)
    if (content)
      fs.writeFileSync(targetPath, content)
    else
      copy(path.join(templateDir, file), targetPath)
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter(f => f !== 'package.json'))
    write(file)

  // eslint-disable-next-line @typescript-eslint/no-var-requires
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

function copy(src: string, dest: string) {
  const stat = fs.statSync(src)
  if (stat.isDirectory())
    copyDir(src, dest)
  else
    fs.copyFileSync(src, dest)
}

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    projectName,
  )
}

function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

function isEmpty(path: string) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

function emptyDir(dir: string) {
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
function pkgFromUserAgent(userAgent?: string) {
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
