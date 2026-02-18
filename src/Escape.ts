/* Copyright (c) 2026, Matthew Richardson
(https://orcid.org/0009-0001-0977-2029).

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/. */

function pctEncodingPair(cp: number): [string, string] {
	const regular = String.fromCodePoint(cp);
	if (cp > 0x7F) {
		return [regular, encodeURI(regular)];
	}
	return [regular, (cp < 0x10 ? '%0' : '%') + cp.toString(16).toUpperCase()];
}

function pctEncodeRange(range: number | [number, number]) {
	const [min, max] = Array.isArray(range) ? range : [range, range];
	return Array.from(Array(max - min + 1), (_, i) => pctEncodingPair(min + i));
}

const urlNonUnits = new Map([
	[0x0, 0x20],
	0x22, 0x23,
	0x25,
	0x3C,
	0x3E,
	[0x5B, 0x5E],
	0x60,
	[0x7B, 0x7D],
	[0x7F, 0x9F],
	[0xFDD0, 0xFDEF],
	0xFFFE, 0xFFFF,
	0x1FFFE, 0x1FFFF,
	0x2FFFE, 0x2FFFF,
	0x3FFFE, 0x3FFFF,
	0x4FFFE, 0x4FFFF,
	0x5FFFE, 0x5FFFF,
	0x6FFFE, 0x6FFFF,
	0x7FFFE, 0x7FFFF,
	0x8FFFE, 0x8FFFF,
	0x9FFFE, 0x9FFFF,
	0xAFFFE, 0xAFFFF,
	0xBFFFE, 0xBFFFF,
	0xCFFFE, 0xCFFFF,
	0xDFFFE, 0xDFFFF,
	0xEFFFE, 0xEFFFF,
	0xFFFFE, 0xFFFFF,
	0x10FFFE, 0x10FFFF
].flatMap(pctEncodeRange));

function urlUnits(str: string) {
	return Array.from(str, function (char): string {
		if (urlNonUnits.has(char)) {
			return urlNonUnits.get(char);
		}
		return char;
	});
}

const pctEncoders = {
	'2396-uric': function (str: string) {
		return encodeURI(str).replaceAll('#', '%23');
	},
	'qval-for-3986': function (str: string) {
		return encodeURI(str).replace(/[#&'+]|%20/g, char => ({
			'#': '%23',
			'&': '%26',
			'+': '%2B',
			'%20': '+'
		}[char]));
	},
	'URL-units': function (str: string) {
		return urlUnits(str).join('');
	},
	'qval-for-URL': function (str: string) {
		const encoded = urlUnits(str);
		for (let i = 0; i < encoded.length; ++i) {
			switch (encoded[i]) {
				case '&':
					encoded[i] = '%26';
					break;
				case '+':
					encoded[i] = '%2B';
					break;
				case '%20':
					encoded[i] = '+';
			}
		}
		return encoded.join('');
	}
};

namespace Escape {

	export function percent(str: string, encoder: string = '2396-uric'): string {
		if (!str.isWellFormed()) {
			throw URIError('Cannot percent-encode a string containing lone surrogates.');
		}
		if (typeof encoder === 'string' && !Object.hasOwn(pctEncoders, encoder)) {
			throw RangeError('Unknown percent-encoder: ' + encoder);
		}
		return pctEncoders[encoder](str);
	}

	export function dataURI(data: string, mediatype: string = ''): string {
		return `data:${mediatype};charset=utf-8,` + percent(data, '2396-uric');
	}

}
