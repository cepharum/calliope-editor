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
const File = require( "fs" );
const Child = require( "child_process" );
const OS = require( "os" );

const Locale = require( "./locale" );


const MaxDepth = 3;



/**
 * Implements access on Calliope devices.
 *
 * @type {Calliope}
 * @name Calliope
 * @property {string} detailsFilename absolute path name of file DETAILS.TXT provided by connected Calliope device
 * @property {string} pathname path name of folder addressing connected Calliope device
 */
module.exports = class Calliope {
	constructor( detailsFilename ) {
		Object.defineProperties( this, {
			detailsFilename: { value: detailsFilename },
			pathname: { value: Path.dirname( detailsFilename ) },
		} );
	}

	/**
	 * Searches filesystem for folder containing files exposed by calliope
	 * devices and returns instance describing first matching device.
	 *
	 * @returns {Promise<Calliope>}
	 */
	static find() {
		return ( ( OS.platform() === "win32" ) ? searchDrives() : searchFolder( "/" ) )
			.then( pathnameOfDetailsTxt => new Calliope( pathnameOfDetailsTxt ) );
	}
};



function searchFolder( pathname, depth = 0 ) {
	return new Promise( ( resolve, reject ) => {
		if ( depth > MaxDepth ) {
			return resolve();
		}

		File.readdir( pathname, ( error, elements ) => {
			if ( error ) {
				return ( depth > 0 ) ? resolve() : reject( error );
			}

			let length = elements.length;
			let probableSubs = new Array( length );
			let write = 0;
			let foundFiles = 0;

			for ( let read = 0; read < length; read++ ) {
				let element = elements[read];

				if ( element[0] !== "." ) {
					switch ( element.toLowerCase() ) {
						case "details.txt" :
						case "mini.htm" :
							if ( ++foundFiles >= 2 ) {
								resolve( Path.resolve( pathname, element ) );
							}
							break;

						default :
							if ( depth < MaxDepth ) {
								probableSubs[write++] = Path.resolve( pathname, element );
							}
					}
				}
			}

			probableSubs.splice( write, length );

			trySub();

			function trySub() {
				if ( !probableSubs.length ) {
					if ( depth > 0 ) {
						return resolve();
					}

					let error = new Error( Locale.current.map.MISSING_CALLIOPE_TEXT );
					error.code = "ENOENT";

					return reject( error );
				}

				let nextSub = probableSubs.shift();

				File.stat( nextSub, ( error, stat ) => {
					if ( error ) {
						return setImmediate( trySub );
					}

					if ( stat.isDirectory() ) {
						searchFolder( nextSub, depth + 1 )
							.then( match => {
								if ( match ) {
									resolve( match );
								} else {
									setImmediate( trySub );
								}
							}, reject );
					}
				} );
			}
		} );
	} );
}


function searchDrives() {
	return new Promise( ( resolve, reject ) => {
		let chunks = [];
		let cmd = Child.spawn( "wmic", [ "logicaldisk", "get", "name" ], { shell: true } );

		cmd.on( "error", reject );
		cmd.stdout.on( "data", chunk => chunks.push( chunk ) );
		cmd.on( "exit", () => {
			let drives = Buffer.concat( chunks )
				.toString()
				.split( /\r\n/ )
				.map( line => line.trim() )
				.filter( line => /^[a-z]:$/i.test( line ) );

			tryNextDrive();

			function tryNextDrive() {
				if ( !drives.length ) {
					let error = new Error( Locale.current.map.MISSING_CALLIOPE_TEXT );
					error.code = "ENOENT";

					return reject( error );
				}


				searchFolder( drives.shift() + "\\", MaxDepth )
					.then( match => {
						if ( match ) {
							resolve( match );
						} else {
							setImmediate( tryNextDrive );
						}
					}, reject );
			}
		} );
	} );
}
