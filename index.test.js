import { getHeader, summarizeFrom } from ".";

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

const fromMsg = `MIME-Version: 1.0
Subject: Test Subject
From: =?utf-8?q?A=E2=80=93Z=E2=80=98_?=
 <noreply@example.com>
To: jane@example.com
`
const fromMsg2 = `MIME-Version: 1.0
Subject: Test Subject
From: John Jacob Jingleheimer Schmidt <jjjs@sub2.sub1.example.com>
To: jane@example.com
`

describe('get sender', () => {
    it('finds and decodes sender', () => {
        expect(getHeader(fromMsg, 'From')).toBe('A–Z‘ <noreply@example.com>')
    })

    it('summarizes sender', () => {
        expect(summarizeFrom(fromMsg2)).toBe('JohnJa-example.com')
    })
})

describe('get subject', () => {
    it('finds plain subjects', () => {
        expect(getHeader(plainSubjectMsg, 'subject')).toBe('Hello there!')
    })
    
    it('finds base64 encoded subjects', () => {
        expect(getHeader(b64SubjectMsg, 'subject')).toBe(`[Ext:] WORDS123 | A–Zz`)
    })    
    
    it('finds subjects with mixed encoding', () => {
        expect(getHeader(mixedSubjectMsg, 'subject')).toBe('[Ext:] WORDS1234 Dude!?')
    })
})
