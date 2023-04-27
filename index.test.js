import { findSubject, decodeRfc1342, decodeQEncoding } from ".";

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
describe('findSubject', () => {
    it('finds plain subjects', () => {
        expect(findSubject(plainSubjectMsg)).toBe('Hello there!')
    })
    
    it('finds base64 encoded subjects', () => {
        expect(findSubject(b64SubjectMsg)).toBe(`[Ext:] WORDS123 | A–Zz`)
    })    
    
    it('finds subjects with mixed encoding', () => {
        expect(findSubject(mixedSubjectMsg)).toBe('[Ext:] WORDS1234 Dude!?')
    })
})

describe('decodeRfc1342', () => {
    it('decodes base64 encoded data', () => {
        expect(decodeRfc1342('=?utf-8?B?W0V4dDpdIFdPUkRTMTIz?=')).toBe('[Ext:] WORDS123')
    })
    it('decodes Q-encoded data', () => {
        expect(decodeRfc1342('=?utf-8?Q?word?=')).toBe('word')
    })
    it('decodes multiple encoded words in sequence', () => {
        expect(decodeRfc1342('=?utf-8?Q?aeiou?= plus =?utf-8?B?w6XDpMO2?=')).toBe('aeiou plus åäö')
    })
})

describe('decodeQEncoding', () => {
    it('replaces underscores with spaces', () => {
        expect(decodeQEncoding('a_b_c')).toBe('a b c')
    })

    it('replaces =20 with spaces (regardless of target encoding)', () => {
        expect(decodeQEncoding('a=20b')).toBe('a b')
    })

    it('decodes hex values for =, _, and ?', ()=> {
        expect(decodeQEncoding('=3D=5F=3F')).toBe('=_?')
    })
})