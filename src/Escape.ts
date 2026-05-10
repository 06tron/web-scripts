/* Copyright (c) 2026, Matthew Richardson
(https://orcid.org/0009-0001-0977-2029).

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const xmlCharData: ByteProcessor = (byte: number) => {
	switch (byte) {
		case 0x26: // & → &amp;
			return [0x26, 0x61, 0x6D, 0x70, 0x3B];
		case 0x3C: // < → &lt;
			return [0x26, 0x6C, 0x74, 0x3B];
		case 0x3E: // > → &gt;
			return [0x26, 0x67, 0x74, 0x3B];
		default:
			return byte;
	}
};

function hexDigit(nybl: number) {
	return nybl + (nybl < 0x0A ? 0x30 : 0x57);
}

const urlQueryValue: ByteProcessor = (byte: number) => {
	if (
		(byte == 0x7E) ||
		(byte <= 0x7A && byte >= 0x61) ||
		(byte == 0x5F) ||
		(byte <= 0x5A && byte >= 0x3F) ||
		(byte == 0x3D) ||
		(byte <= 0x3B && byte >= 0x2C) ||
		(byte <= 0x2A && byte >= 0x27) ||
		(byte == 0x24) ||
		(byte == 0x21)
	) {
		return byte;
	}
	return [
		0x25,
		hexDigit(byte >> 4),
		hexDigit(byte & 0x0F)
	];
};

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
		return encodeURI(str).replace(/[#&+]|%20/g, char => ({
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

export namespace Escape {

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

	export function objToQuery(pairs: { [k: string]: string }) {
		const encoded = Object.entries(pairs).map(function ([k, v]) {
			return percent(k, 'qval-for-3986').replaceAll('=', '%3D')
				+ '='
				+ percent(v, 'qval-for-3986');
		});
		return '?' + encoded.join('&');
	}

}
