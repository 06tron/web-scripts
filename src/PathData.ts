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
		fullBase = fullBase.slice(0, power - logStep);
		power += logStep;
	}
	if (fullBase.length == 0) {
		return ['', '0', 'e', 0];
	}
	const shortBase = fullBase.replace(/0+$/, '');
	power += fullBase.length - shortBase.length;
	return [sign as '' | '-', shortBase, 'e', power];
}

/**
 * Returns a minimal length string. A string starting with '.' is returned if possible. If no minimal length string starts with '.', then a string containing '.' or 'e' is returned if possible.
 * 
 * @param {SplitCoord} coord 
 * @returns {string}
 */
function shortCoord(coord: SplitCoord): string {
	const [sign, shortBase, , power] = coord;
	if (power >= 2) {
		return coord.join('');
		// '0'.repeat(power) is not shorter than `e${power}`, and there's no benefit to using a different exponent. Appending '0' to shortBase decreases exponent by 1, but power > 1 so the decimal representation of the exponent won't decrease in length by more than one character. To justify inserting '.' into shortBase, the exponent part would need to decrease in length, but adding the decimal point only increases the exponent.
	}
	if (power == 0 || power == 1) {
		return sign + shortBase + '0'.repeat(power);
		// Adds at most one character to shortBase, and any other representation would include an exponent part, which would be at least two extra characters. Note that this approach is suboptimal when power = 2, as even though '1e2' and '100' are the same length, the coordinate pair '1e2.1' is shorter than '100,.1'.
	}
	if (power >= -shortBase.length && power <= -1) {
		const i = shortBase.length + power;
		return sign + shortBase.slice(0, i) + '.' + shortBase.slice(i);
		// Adds a single character.
	}
	if (power == -shortBase.length - 1) {
		return sign + '.0' + shortBase;
		// Adds two characters, but the result always starts with '.' or '-.' which cannot be improved upon.
	}
	const l = -power - shortBase.length;
	const minExp = 'e' + power.toString();
	const midExp = 'e' + (-l).toString();
	if (l <= midExp.length && l < minExp.length) {
		return sign + '.' + '0'.repeat(l) + shortBase;
		// a
	}
	if (midExp.length < minExp.length) {
		return sign + '.' + shortBase + midExp;
		// b
	}
	return sign + shortBase + minExp;
	// power == -shortBase.length - X
	// no 'e': adds X+1 characters, starts with '.' or '-.'
	// no '.': adds `e${-shortBase.length - X}`.length characters, doesn't start with '.'
	// uses starting '.' and 'e': (Y <= X) adds X+1-Y plus `e${-Y}`.length characters
	// Y ranges from 0 to -power-shortBase.length
}



const testcases = [-0, -0.0012345678, -1.2e4, -100, 1e-3, 1e-10];

namespace PathData {

	export function coord(n: number, step: number | undefined): string {
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
