/* Copyright (c) 2026, Matthew Richardson
(https://orcid.org/0009-0001-0977-2029).

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/. */

class CharSeq {

	str: String;

	pullNumberArray() {
		return (this.str.match(/-?(?:\d*\.)?\d+(?:[eE]-?\d+)?/g) ?? []).map(Number);
	}

	charSwap(arg = '7>5<(S)T') {
		const mapMatch = new RegExp('[' + arg.replace(/[\\^\]-]/g, '\\$&') + ']', 'g');
		this.str = this.str.replace(mapMatch, function (char) {
			return arg.charAt(arg.length - arg.indexOf(char) - 1);
		});
		return this;
	}

	getNumbers(arg = ',') {
		this.str = this.pullNumberArray().map(n => PathData.coord(n)).join(arg);
		return this;
	}

	toWebpage(arg, fellback) {
		
	}
	
}
