/**
 * (c) 2017 cepharum GmbH, Berlin, http://cepharum.de
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 cepharum GmbH
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @author: cepharum
 */

"use strict";

const Path = require( "path" );


/**
 * Provides information on single locale.
 *
 * @type {Locale}
 * @name Locale
 * @property {string} tag
 */
module.exports = class Locale {
	constructor( tag ) {
		Object.defineProperties( this, {
			tag: { value: tag, enumerable: true },
		} );
	}

	/**
	 * Fetches locale's l10n mapping.
	 *
	 * @returns {object<string,string>}
	 */
	get map() {
		return require( Path.resolve( __dirname, "../locale/" + this.tag ) );
	}

	/**
	 * Fetches information on current locale.
	 *
	 * @returns {Locale}
	 */
	static get current() {
		// TODO implement actual detection of current locale
		return new Locale( "de" );
	}
};
