/* Copyright (c) 2026, Matthew Richardson
(https://orcid.org/0009-0001-0977-2029).

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/. */

type ByteProcessor = (byte: number) => number | number[];

class TextUTF8 {

	#parts: Uint8Array[] = [];
	length: number = 0;

	#readIterable(bytes: Iterable<number>, partSize = 1024) {
		const input = bytes[Symbol.iterator]();
		let r = input.next();
		while (!r.done) {
			const part = new Uint8Array(partSize);
			for (let j = 0; j < part.length; ++j) {
				if (r.done) {
					this.#parts.push(part.subarray(0, j));
					this.length += j;
					return this;
				}
				part[j] =
					(Number.isInteger(r.value) && r.value >= 0 && r.value < 256)
					? r.value
					: 0x1A;
				r = input.next();
			}
			this.#parts.push(part);
			this.length += part.length;
		}
		return this;
	}

	#readUint8Array(bytes: Uint8Array) {
		if (bytes.length > 0) {
			this.#parts.push(bytes);
			this.length += bytes.length;
		}
		return this;
	}

	#readString(source: string) {
		if (source.length > 0) {
			this.#readUint8Array(new TextEncoder().encode(source));
		}
		return this;
	}

	#readTextUTF8(source: TextUTF8) {
		this.#parts.push(...source.#parts);
		this.length += source.length;
		return this;
	}

	#readAny(source: any) {
		if (source instanceof TextUTF8) {
			this.#readTextUTF8(source);
		} else if (source instanceof Uint8Array) {
			this.#readUint8Array(source);
		} else if (typeof source === 'string') {
			this.#readString(source);
		} else if (Symbol.iterator in source) {
			this.#readIterable(source);
		} else {
			this.#readString(String(source));
		}
		return this;
	}

	static fromBytes(bytes: Iterable<number>, maxLength?: number) {
		const output = new TextUTF8();
		if (bytes instanceof Uint8Array) {
			const input =
				(maxLength !== undefined)
				? bytes.subarray(0, maxLength)
				: bytes;
			output.#readUint8Array(input);
		} else {
			if (maxLength !== undefined) {
				bytes = Iterator.from(bytes).take(maxLength);
			}
			output.#readIterable(bytes, maxLength);
		}
		return output;
	}

	static fromString(source: string) {
		return new TextUTF8().#readString(source);
	}
	
	static tag(strings: TemplateStringsArray, ...values: any[]) {
		const output = new TextUTF8();
		output.#readString(strings[0]);
		for (let i = 0; i < values.length; ++i) {
			output.#readAny(values[i]);
			output.#readString(strings[i + 1]);
		}
		return output;
	}

	add(source: TextUTF8 | string) {
		this.#readAny(source);
		return this;
	}

	process(...steps: ByteProcessor[]) {
		return new TextUTF8().#readIterable(
			this.#parts.values().flatMap(
				part => part.values().flatMap(
					startByte => steps.reduce(
						(accumulatedBytes, step) => accumulatedBytes.flatMap(step),
						[startByte]
					)
				)
			)
		);
	}

	slice(s: number, t = this.length) {
		s += s < 0 ? this.length : 0;
		t += t < 0 ? this.length : 0;
		const trimmed = [];
		let sPart = 0;
		for (let i = 0; i < this.#parts.length; ++i) {
			const tPart = sPart + this.#parts[i].length;
			if (s < tPart) {
				const p = this.#parts[i].subarray(
					Math.max(0, s - sPart),
					Math.max(0, t - sPart)
				);
				if (p.length > 0) {
					trimmed.push(p);
				}
			}
			if (t <= tPart) {
				break;
			}
			sPart = tPart;
		}
		this.#parts = trimmed;
		this.length = Math.max(0, t - s);
		return this;
	}

	toString() {
		const strings = Array(this.#parts.length);
		const td = new TextDecoder();
		let i = 0;
		while (i < strings.length - 1) {
			strings[i] = td.decode(this.#parts[i], { stream: true });
			++i;
		}
		strings[i] = td.decode(this.#parts[i]);
		return strings.join('');
	}

}

export { ByteProcessor, TextUTF8 };
