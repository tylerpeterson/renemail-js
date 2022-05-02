#! /usr/bin/env node

import { program } from 'commander'
import { readFile, rename } from 'fs/promises'
import { parse, format } from 'date-fns'
import { join, dirname, extname } from 'path'

async function renemail () {
  program
    .description('Rename an email file based on its contents.')
  program.parse()

  const filenames = program.args
  const filePromises = filenames.map(filename => readFile(filename, { encoding: 'utf8' }))
  const renamePromises = []
  filePromises.forEach(async function (filePromise, i) {
    const file = await filePromise
    const filename = filenames[i]
    const head = file.substring(0, 4096)
    const foundDate = head.match(/^Date: \w+, (.*\d{4})( \(\w+\))?$/m)[1]
    const date = parse(foundDate, 'd LLL yyyy HH:mm:ss XXXX', new Date())
    const fileDateTime = format(date, 'yyyy-MM-dd-HH-mm')
    const foundSubject = head.match(/^Subject: (.*)$/m)[1]
    const simpleSubject = foundSubject.replace(/\W+/g, '_').substring(0, 65)
    const ext = extname(filename)
    const newName = `${fileDateTime} ${simpleSubject}${ext}`
    const newPath = join(dirname(filename), newName)
    renamePromises.push(rename(filename, newPath))

    console.log(`mv ${filename} ${newPath}`)
  })
}

renemail()
