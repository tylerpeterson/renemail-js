#! /usr/bin/env node

import { program } from 'commander'
import { readFile, rename } from 'fs/promises'
import { parse, format } from 'date-fns'
import { join, dirname, basename, extname } from 'path'

async function renemail () {
  program
    .description('Rename an email file based on its contents.')
  program.parse()

  const startsWithDateTime = /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}/

  const filenames = program.args
      .filter(name => extname(name) === '.eml')
      .filter(name => !startsWithDateTime.test(basename(name)))
  const filePromises = filenames.map(filename => readFile(filename, { encoding: 'utf8' }))
  const renamePromises = []
  filePromises.forEach(async function (filePromise, i) {
    const filename = filenames[i]
    try {
      const file = await filePromise
      const foundDate = file.match(/^Date: (?:\w+, )?(.*\d{4})( \(\w+\))?$/m)[1]
      const date = parse(foundDate, 'd LLL yyyy HH:mm:ss XXXX', new Date())
      const fileDateTime = format(date, 'yyyy-MM-dd-HH-mm')
      const foundSubject = file.match(/^Subject: (.*)$/m)[1]
      const simpleSubject = foundSubject.replace(/\W+/g, '_').substring(0, 65)
      const ext = extname(filename)
      const newName = `${fileDateTime} ${simpleSubject}${ext}`
      const newPath = join(dirname(filename), newName)
      renamePromises.push(rename(filename, newPath))
  
      console.log(`mv ${filename} ${newPath}`)
    } catch (err) {
      console.error(`ERR processing ${filename}.\n${err.name}: ${err.message}`)
    }
  })
}

renemail()
