#! /usr/bin/env node

import { program } from 'commander'
import { readFile, rename } from 'fs/promises'
import { parse, format } from 'date-fns'
import { join, dirname, basename, extname } from 'path'
import rfc2047 from 'rfc2047'
const { decode } = rfc2047

program
  .option('-D, --dry-run', "report what would be changed; don't make any changes")
  .option('-d, --debug', "print extra debug information")
  .option('-s, --silent', "don't report on file renames")
  .option('-f, --format <number>', 'which format should we use for renaming? 1 or 2', 1)
  .option('-F, --force', "don't skip files that appear to start with a date.")
  .description('Rename an email file based on its contents.')
program.parse(process.argv)

const options = program.opts()
const DRY_RUN = !!options.dryRun
const DEBUG = !!options.debug
const SILENT = !!options.silent
const FORMAT = options.format
const FORCE = !!options.force
const startsWithDateTime = /^(?:\d{4}-\d{2}-\d{2}-\d{2}-\d{2}|\d{6}-\d{4}) /

if (FORMAT < 0 || FORMAT > 2) {
  console.error(`Unsupported format: ${FORMAT}. Format must be either 1 or 2`)
  process.exit(1)
}

DEBUG && console.log(`options: `, options)

async function renemail () {
  const filenames = program.args
      .filter(name => extname(name) === '.eml')
      .filter(name => FORCE || !startsWithDateTime.test(basename(name)))
  const filePromises = filenames.map(filename => readFile(filename, { encoding: 'utf8' }))
  const renamePromises = []
  filePromises.forEach(async function (filePromise, i) {
    const filename = filenames[i]
    try {
      const file = await filePromise

      DEBUG && console.log(`processing ${filename}...`)

      const newName = computeName(file, filename)
      const newPath = join(dirname(filename), newName)

      if (!DRY_RUN) {
        renamePromises.push(rename(filename, newPath))
      }
  
      SILENT || console.log(`mv ${filename} ${newPath}`)
      
    } catch (err) {
      console.error(`ERR processing ${filename}.\n`, err)
    }
  })
}

function computeName(file, filename) {
  const fileDateTime = computeDate(file)
  const simpleSubject = summarizeSubject(file)
  const ext = extname(filename)
  let newName
  if (FORMAT === 1) {
    newName = `${fileDateTime} ${simpleSubject}${ext}`
  } else {
    newName = `${fileDateTime} ${summarizeFrom(file)} ${simpleSubject}${ext}`    
  }
  return newName
}

function summarizeSubject(file) {
  const foundSubject = getHeader(file, 'subject')
  let summary = foundSubject.replace(/\W+/g, '_')
  summary = summary.replace(/^_?((Re|Fwd|Fw|Ext)_)+_?/gi, '')
  summary = summary.substring(0, 45)
  return summary
}

export function summarizeFrom(email) {
  const sender = getHeader(email, 'From').replaceAll(/[^@a-z0-9.]/ig, '')
  const domain = sender.split('@')[1]
  DEBUG && console.log(`sender: "${sender}", domain: "${domain}"`)
  return `${sender.slice(0, 6)}-${domain.split('.').slice(-2).join('.').slice(0, 12)}`
}

const DATE_FORMATS = [
  'yyyy-MM-dd-HH-mm',
  'yyMMdd-HHmm'
]

function computeDate(file) {
  const foundDate = file.match(/^Date: (?:\w+, +)?(.*\d{4})( \(\w+\))?$/m)[1]
  const date = parse(foundDate, 'd LLL yyyy HH:mm:ss XXXX', new Date())
  return format(date, DATE_FORMATS[FORMAT - 1])
}

const ENDINGS_PATTERN = /\r\n|\r|\n/
const CONTINUE_PATTERN = /^\s/

export function getHeader(email, name) {
  DEBUG && console.log(`getHeader ${name}`)
  let value = null
  const lines = email.split(ENDINGS_PATTERN)
  DEBUG && console.log(`scanning ${lines.length} lines`)
  const headerPattern = new RegExp(`^${name}: ?`, 'i')
  for (let i = 0; i < lines.length; ++i) {
    let line = lines[i]
    const match = headerPattern.exec(line)
    if (match !== null) {
      DEBUG && console.log(`line ${i} found "${name}" in "${line}"`)
      const rawValue = line.slice(match[0].length)
      DEBUG && console.log(`discarding header name leaves "${rawValue}"`)
      value = decode(rawValue)
      for (let j = i + 1; j < lines.length; ++j) {
        line = lines[j]
        DEBUG && console.log(`checking for continued value on line ${j}, "${line}"`)
        if (!CONTINUE_PATTERN.test(line)) {
          DEBUG && console.log(`line doesn't start with a space. terminating value scan`)
          break
        }
        value += decode(line.slice(1))
      }
      break
    }
  }

  return value
}

renemail()
