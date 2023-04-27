import { findSubject } from ".";

const b64SubjectMsg = `MIME-Version: 1.0
Subject:
 =?utf-8?B?W0V4dDpdIFdPUkRTMTIz?=
 =?utf-8?B?IHwgQeKAk1p6?=
From: John <john@example.com>
`

const plainSubjectMsg = `MIME-Version: 1.0
Subject: Hello there!
From: John <john@example.com>
`

const mixedSubjectMsg = `MIME-Version: 1.0
Subject:
 =?utf-8?B?W0V4dDpdIFdPUkRTMTIz?=
 =?utf-8?Q?4_Dude=21=3F?=
From: John <john@example.com>
`

test('finds plain subjects', () => {
    expect(findSubject(plainSubjectMsg)).toBe('Hello there!')
})

test('finds base64 encoded subjects', () => {
    expect(findSubject(b64SubjectMsg)).toBe(`[Ext:] WORDS123 | A–Zz`)
})    

test('finds subjects with mixed encoding', () => {
    expect(findSubject(mixedSubjectMsg)).toBe('[Ext:] WORDS1234 Dude!?')
})