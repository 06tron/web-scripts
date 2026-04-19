/* Copyright (c) 2026, Matthew Richardson
(https://orcid.org/0009-0001-0977-2029).

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const htmlCharMap = `&"><'%X\tZ\n$~()*@`;

class CharSeq {

	str: string;

	constructor(str: string) {
		this.str = str;
	}

	pullNumberArray() {
		return (this.str.match(/-?(?:\d*\.)?\d+(?:[eE]-?\d+)?/g) ?? []).map(Number);
	}

	toString() {
		return this.str;
	}

	charSwap(arg = '7>5<(S)T') {
		this.str = this.str.replace(
			RegExp('[' + arg.replace(/[\\^\]-]/g, '\\$&') + ']', 'g'),
			function (char) {
				return arg.charAt(arg.length - arg.indexOf(char) - 1);
			}
		);
		return this;
	}

	getNumbers(arg = ',') {
		this.str = this.pullNumberArray().map(n => PathData.coord(n)).join(arg);
		return this;
	}

	toDataURI(arg = 'text/plain') {
		this.str = Escape.dataURI(this.str, arg);
		return this;
	}

	toQueryValue() {
		this.str = Escape.percent(this.str, 'qval-for-3986');
		return this;
	}

	/**
	 * Calls stringify to check for characters that might need to be
	 * escaped. Currently has inconsistent preferences.
	 */
	toScriptVar() {
		const rep = JSON.stringify(this.str);
		if (!/\\[^"]|'/.test(rep)) {
			this.str = "let str = '" + this.str + "';";
			return this;
		}
		if (!/\\/.test(rep) || /\\[^"]|`|\${/.test(rep)) {
			this.str = 'let str = ' + rep + ';';
			return this;
		}
		this.str = 'let str = `' + this.str + '`;';
		return this;
	}

	toWebpage(arg = htmlCharMap, fellback = false) {
		let prefix = 'https://6t.lt?'; 
		if (!fellback) {
			prefix += Escape.uriVariable('m', arg) + '&';
		}
		this.str = prefix + 'h=' + this.charSwap(arg).toQueryValue();
		return this;
	}
	
}
