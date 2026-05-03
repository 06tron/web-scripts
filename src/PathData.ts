/* Copyright (c) 2026, Matthew Richardson
(https://orcid.org/0009-0001-0977-2029).

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/. */

type SplitCoord = ['' | '-', string, 'e', number];

function parseCoord(n: number, logStep: number | undefined): SplitCoord {
	const [, sign, naturalPart, fractionPart, exponentPart]: string[]
		= /^(-?)(\d*)\.?(\d*)e?(.*)/.exec(n.toString()) ?? Array(5).fill('');
	let fullBase = (naturalPart + fractionPart).replace(/^0+/, '');
	let power = Number(exponentPart) - fractionPart.length;
	if (logStep !== undefined && power - logStep < 0) {
		const cutDigit = Number(fullBase.at(power - logStep) ?? 0);
		fullBase = fullBase.slice(0, power - logStep);
		power = logStep;
		if (cutDigit >= 5) {
			const preLen = fullBase.length;
			fullBase = fullBase.replace(/9+$/, '');
			power += preLen - fullBase.length;
			if (fullBase.length == 0) {
				fullBase = '1';
			} else {
				const endDigit = Number(fullBase.at(-1));
				fullBase = fullBase.slice(0, -1) + (endDigit + 1);
			}
		}
	}
	if (fullBase.length == 0) {
		return ['', '0', 'e', 0];
	}
	const shortBase = fullBase.replace(/0+$/, '');
	power += fullBase.length - shortBase.length;
	return [sign as '' | '-', shortBase, 'e', power];
}

/**
 * Returns a minimal length string. A string starting with '.' is
 * returned if possible. If no minimal length string starts with
 * '.', then a string containing '.' or 'e' is returned if
 * possible.
 * 
 * @param {SplitCoord} coord 
 * @returns {string}
 */
function shortCoord(coord: SplitCoord): string {
	const [sign, shortBase, , power] = coord;
	if (power >= 2) {
		return coord.join('');
		// '0'.repeat(power) is not shorter than `e${power}`, and
		// there's no benefit to using a different exponent. Appending
		// '0' to shortBase decreases exponent by 1, but since power>1
		// the decimal representation of the exponent won't decrease in
		// length by more than one character. To justify inserting '.'
		// into shortBase, the exponent part would need to decrease in
		// length, but moving the decimal point to the left of its
		// implicit position only increases the exponent.
	}
	if (power == 0 || power == 1) {
		return sign + shortBase + '0'.repeat(power);
		// Adds at most one character to shortBase, and any other
		// representation would include an exponent part, which would
		// be at least two extra characters. Note that this approach is
		// suboptimal when power=2, as even though '1e2' and '100' are
		// the same length, the coordinate pair '1e2.1' is shorter than
		// '100,.1'.
	}
	if (power >= -shortBase.length && power <= -1) {
		const i = shortBase.length + power;
		return sign + shortBase.slice(0, i) + '.' + shortBase.slice(i);
		// Adds a single character.
	}
	if (power == -shortBase.length - 1) {
		return sign + '.0' + shortBase;
		// Adds two characters, but the result always starts with '.'
		// or '-.' which cannot be improved upon.
	}
	const z = -power - shortBase.length;
	// At this point, -power>=shortBase.length+2, so z>=2, and z is
	// the number of zeros to be inserted between '.' and shortBase
	// when not using an exponent.
	const minExp = 'e' + power.toString();
	// The exponent used when not inserting a decimal point.
	const midExp = 'e' + (-z).toString();
	// A larger (less negative) exponent used when inserting '.'
	// directly to the left of shortBase. Since shortBase.length>=1,
	// we know z<=-power-1, and -z>=power+1.
	if (z + 1 <= minExp.length && z <= midExp.length) {
		return sign + '.' + '0'.repeat(z) + shortBase;
		// Without an exponent the result has a leading '.' and is not
		// longer than the two exponent options. To show this is
		// minimal, note that the result string will fall into one of
		// three categories: (1) No exponent, (2) uses exponent but not
		// '.', (3) uses '.' and exponent. For the first case, we
		// prepend '.' and a fixed number of zeros, and this form is
		// considered for output. In the second case, the decimal point
		// is set implicitly, the exponent is minExp, and we consider
		// this form for output. In the third case, we only consider a
		// single form for output. This form uses midExp, and no other
		// form using both '.' and an exponent is shorter. If we were
		// to move the decimal to the left, we would add '0' at each
		// step and increment the exponent. These steps can't reduce
		// the length of the exponent by more than one, so adding the
		// zeros cannot shorten the result. Moving the decimal to the
		// right potentially adds zeros to the right of shortBase, and
		// only makes the exponent more negative. We just need to
		// consider one possible result from each of the three
		// categories.
	}
	if (midExp.length + 1 <= minExp.length) {
		return sign + '.' + shortBase + midExp;
		// The midExp form is preferred over minExp because of the
		// leading decimal point.
	}
	return sign + shortBase + minExp;
}

function testShortCoord() {
	const input = [
		['0', 0.000, 0e0, 0e-14],
		['1e2', 1000e-1, 100, 1e2, .01e4],
		['-123e10', -123e10],
		['-12', -12],
		['1230', 1230, 1.23e3],
		['-1.2', -1.2],
		['12345.6789', 12345.67890, .1234567890e5],
		['-.01', -.01, -0.01e0],
		['.0123', .0123, 123e-4],
		['.0012345678', .0012345678, 12345678e-10, .12345678e-2],
		['-.001', -1e-3, -0.001],
		['.000123456789', .000123456789, 123456789e-12],
		['.1e-9', .1e-9, 1e-10, .0000000001],
		['-.12e-8', -0.12e-8, -12e-10],
		['.123456789e-9', 123456789e-18, .123456789e-9],
		['.1234e-6', 1234e-10, 1.234e-7],
		['-1e-4', -1e-4, -0.001e-1]
	];
	for (const equiv of input) {
		const target = equiv[0];
		for (let i = 1; i < equiv.length; ++i) {
			const result = PathData.coord(equiv[i] as number);
			if (result !== target || Number(result) !== equiv[i]) {
				console.log("Error:", target, result, equiv[i]);
			}
		}
	}
}

export namespace PathData {

	export function coord(n: number, step?: number | undefined): string {
		if (!Number.isFinite(n)) {
			throw RangeError('Coordinate must be a finite number.');
		}
		if (step !== undefined) {
			step = Math.log10(step);
			if (!Number.isInteger(step)) {
				throw RangeError('Step length must be an integer power of 10.');
			}
		}
		return shortCoord(parseCoord(n, step));
	}

}

/**
 * Start by converting n to a string and isolating the important parts. If
 * string's last character is not numeric, as is the case when n is Infinity,
 * return the string unchanged. First pull the decimal out of the base and
 * adjust the exponent accordingly. If the base is zero return "0". Then shorten
 * the base by removing trailing zeros, and adjust the exponent. At this point n
 * is represented as an integer base with no leading or trailing zeros
 * multiplied by 10 to some integer power. Next there are three cases to
 * consider. If the exponent is 0, 1, or 2 add trailing zeros to the base and
 * return. Example: "60" is shorter than "6e1". If the exponent is negative and
 * its absolute value is no more than one greater than the length of the base,
 * add a decimal point and return. Example: ".06" is shorter than "6e-2".
 * Otherwise return the base, "e", and the exponent concatenated together.
 * Examples: "6e3" is shorter than "6000" and "16e-9" is shorter than "1.6e-8".
 *
 * @param {string} coord
 * @param {number | undefined} logStep
 * @returns {string}
 */
