/* Copyright (c) 2026, Matthew Richardson
(https://orcid.org/0009-0001-0977-2029).

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/. */

function percentChar(char: string) {
	const code = char.charCodeAt(0);
	if (code < 0x80) {
		return (code < 0x10 ? '%0' : '%') + code.toString(16).toUpperCase();
	}
	return encodeURI(char);
}

function urlUnits(str: string): string[] {
	const encoded = new Map();
	return Array.from(str, function (char): string {
		// return encoded.getOrInsertComputed(char, percentChar);
		return ''; // need to update TS for above line
	});
}

const pctEncoders = {
	'2396-uric': function (str: string) {
		return encodeURI(str).replaceAll('#', '%23');
	}
};

namespace Escape {

	export function percent(str: string, encoder: string = '2396-uric'): string {
		return '';
		// if (!str.isWellFormed()) {
		// 	throw URIError('Cannot percent-encode a string containing lone surrogates.');
		// }
		// if (typeof encoder === 'string') {
		// 	if (!Object.hasOwn(pctEncoders, encoder)) {
		// 		throw RangeError('Unknown percent-encoder: ' + encoder);
		// 	}
		// 	encoder = pctEncoders[encoder];
		// }
		// if (typeof encoder[1] !== 'function') {
		// 	throw RangeError('Percent-encoder is not a function.');
		// }
		// if (encoder[0]) {
		// 	return encoder[1](str);
		// }
		// return encoder[1](str.split('')).join('');
	}

	export function dataURI(data: string, mediatype: string = ''): string {
		return `data:${mediatype};charset=utf-8,` + percent(data, '2396-uric');
	}

}
