#! /usr/bin/env node

import { program } from 'commander'
import { readFile, rename } from 'fs/promises'
import { parse, format } from 'date-fns'
import { join, dirname, basename, extname } from 'path'

program
  .option('-D, --dry-run', "report what would be changed; don't make any changes")
  .option('-d, --debug', "print extra debug information")
  .option('-s, --silent', "don't report on file renames")
  .description('Rename an email file based on its contents.')
program.parse(process.argv)

const options = program.opts()
const DRY_RUN = !!options.dryRun
const DEBUG = !!options.debug
const SILENT = !!options.silent
const startsWithDateTime = /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}/

DEBUG && console.log(`options: `, options)

async function renemail () {
  const filenames = program.args
      .filter(name => extname(name) === '.eml')
      .filter(name => !startsWithDateTime.test(basename(name)))
  const filePromises = filenames.map(filename => readFile(filename, { encoding: 'utf8' }))
  const renamePromises = []
  filePromises.forEach(async function (filePromise, i) {
    const filename = filenames[i]
    try {
      const file = await filePromise
      DEBUG && console.log(`processing ${filename}...`)
      const foundDate = file.match(/^Date: (?:\w+, )?(.*\d{4})( \(\w+\))?$/m)[1]
      const date = parse(foundDate, 'd LLL yyyy HH:mm:ss XXXX', new Date())
      const fileDateTime = format(date, 'yyyy-MM-dd-HH-mm')
      const foundSubject = findSubject(file)
      const simpleSubject = foundSubject.replace(/\W+/g, '_').substring(0, 65)
      const ext = extname(filename)
      const newName = `${fileDateTime} ${simpleSubject}${ext}`
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

const plainSubjectPattern = /^Subject: (.*)$/mi
const rfc1342SubjectPattern = /^Subject:(?:\r\n|\r|\n)/mi
const rfc1342EncodedPattern = /^ [=][?]utf[-]8[?](?<encoding>[BQ])[?](?<content>.*)[?][=](?:\r\n|\r|\n)/my
const CONTEXT_CHARS_COUNT = 85

function findSubject(text) {
  const plainMatch = plainSubjectPattern.exec(text)
  if (plainMatch) {
    DEBUG && console.log(`found plain subject header ${plainMatch[0]}`)
    return plainMatch[1]
  }
  const encodedMatch = rfc1342SubjectPattern.exec(text)
  if (encodedMatch) {
    DEBUG && console.log(`found rfc 1342 encoded subject header`)
    const headerText = encodedMatch[0]
    const startIndex = encodedMatch.index + headerText.length
    DEBUG && console.log(`searching for encoded content starting at ${startIndex}\n${text.slice(startIndex, startIndex + CONTEXT_CHARS_COUNT)}...`)
    rfc1342EncodedPattern.lastIndex = startIndex
    let subject = ''
    let headerMatch
    while (headerMatch = rfc1342EncodedPattern.exec(text)) {
      const encoding = headerMatch.groups.encoding
      DEBUG && console.log(`found ${encoding}-encoded content`)
      if (encoding === 'Q') {
        const quoted = headerMatch.groups.content
        DEBUG && console.log(`found quoted text '${quoted}'`)
        subject += quoted.replaceAll('_', ' ')
      } else {
        const encoded = headerMatch.groups.content
        DEBUG && console.log(`found base64 encoded content '${encoded}'`)
        const plain = Buffer.from(encoded, 'base64').toString('utf8')
        DEBUG && console.log(`decoded text '${plain}'`)
        subject += plain
      }
    }
    DEBUG && console.log(`decoded rfc 1342 encoded subject: '${subject}'`)
    return subject
  }

}

renemail()
