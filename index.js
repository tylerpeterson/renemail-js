#! /usr/bin/env node

import { program } from 'commander'
import { readFile } from 'fs/promises'
import { parse, format } from 'date-fns'

async function renemail () {
  program
    .description('Rename an email file based on its contents.')
  program.parse()

  const filePromises = program.args.map(filename => readFile(filename, { encoding: 'utf8' }))
  filePromises.forEach(async function (filePromise) {
    const file = await filePromise
    const head = file.substring(0, 2048)
    const foundDate = head.match(/^Date: \w+, (.*)$/m)[1]
    const date = parse(foundDate, 'd LLL yyyy HH:mm:ss XXXX', new Date())
    const fileDateTime = format(date, 'yyyy-MM-dd-HH-mm')
    const foundSubject = head.match(/^Subject: (.*)$/m)[1]
    const simpleSubject = foundSubject.replace(/\W+/g, '_').substring(0, 65)

    console.log(`${fileDateTime}--${simpleSubject}`)
  })
}

renemail()
