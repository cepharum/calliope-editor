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
const SevenZip = require( "7zip-bin" );



module.exports = function( grunt ) {

	grunt.initConfig( {
		clean: {
			publish: [ ".publish" ],
			sass: [ ".publish/assets/**.scss" ],
			buildAll: [ ".build/**/*" ],
			build: [ ".build/**/*", "!.build/*.zip" ],
		},
		copy: {
			publish:{
				files: [
					{
						expand: true,
						src: [
							"assets/**",
							"!assets/*.css*",
							"lib/**",
							"locale/**",
							"*.html",
							"*.js",
							"package.json",
							"LICENSE",
							"README.md",
						],
						dest: ".publish/",
					}
				]
			}
		},
		sass: {
			publish: {
				files: [ {
					expand: true,
					src: [ ".publish/assets/*.scss" ],
					ext: ".css",
				} ],
			}
		},
		drop_fonts: {
			publish: {
				fonts: {
					cwd: ".publish/assets/",
					src: [ "font/**/*.{otf,ttf,woff,woff2,svg}" ],
				},
				styles: {
					src: [".publish/assets/*.css"],
				}
			}
		},
		cssmin: {
			publish: {
				files: [ {
					expand: true,
					cwd: ".publish/assets",
					src: [ "*.css" ],
					dest: ".publish/assets",
				} ]
			}
		},
		auto_install: {
			publish: {
				options: {
					cwd: ".publish",
					npm: "--production",
					failOnError: true,
				}
			}
		},
		"electron-packager": {
			allOfCurrentPlatform: {
				options: {
					arch: "all",
					dir: ".publish",
					out: ".build",
					asar: true,
					overwrite: true,
					prune: true,
					win32metadata: {
						CompanyName: "cepharum GmbH",
					},
				},
			},
		},
		zip: {
			build: {
				expand: true,
				cwd: ".build/",
				src: ["*", "!*.zip"],
				dest: ".build/",
			},
		},
	} );

	grunt.loadNpmTasks( "grunt-contrib-clean" );
	grunt.loadNpmTasks( "grunt-contrib-copy" );
	grunt.loadNpmTasks( "grunt-sass" );
	grunt.loadNpmTasks( "grunt-auto-install" );
	grunt.loadNpmTasks( "grunt-contrib-cssmin" );
	grunt.loadNpmTasks( "grunt-electron-packager" );
	grunt.loadNpmTasks( "grunt-zip" );

	grunt.registerMultiTask( "drop_fonts", "Drop all but used font files.", function() {
		const fontsConfig = this.data.fonts;
		const stylesConfig = this.data.styles;

		const fonts = grunt.file.expand( fontsConfig, fontsConfig.src );
		const styles = grunt.file.expand( stylesConfig, stylesConfig.src );

		let patterns = {};
		fonts
			.forEach( pathname => {
				patterns[pathname] = new RegExp( "\\(\\s*[\"']?" + pathname + "[?\"']?\\s*\\)" );
			} );

		let used = {};
		styles
			.map( fname => grunt.file.read( fname, { encoding: "utf8" } ) )
			.forEach( css => {
				Object.keys( patterns )
					.forEach( name => {
						if ( patterns[name].test( css ) ) {
							delete patterns[name];
						}
					} );
			} );

		if ( !Object.keys( patterns )
			.every( pathname => grunt.file.delete( Path.resolve( fontsConfig.cwd, pathname ) ) ) ) {
			grunt.error( "failed removing font file " + pathname );
		}
	} );

	grunt.registerMultiTask( "zip", "Zip folders.", function() {
		const config = this.data;

		const tasks = grunt.file.expandMapping( config.src, config.dest, config );

		const done = this.async();

		run();

		function run() {
			if ( !tasks.length ) {
				return done();
			}

			let {src} = tasks.shift();

			const args = [
				"a",
				"-r",
				"-mx9",
				"-tzip",
				Path.resolve( __dirname, config.dest, Path.basename( src[0] ) + ".zip" ),
			].concat( src.map( fname => Path.resolve( __dirname, fname, "*" ) ) );

			grunt.util.spawn( {
				cmd: SevenZip.path7za,
				args,
			}, ( error, result, code ) => {
				if ( error ) {
					return done( error );
				}
				if ( code ) {
					return done( new Error( "running 7zip exited with " + code ) );
				}

				setImmediate( run );
			} );
		}
	} );

	grunt.registerTask( "publish", [
		"clean:publish",
		"clean:buildAll",
		"copy:publish",
		"sass:publish",
		"clean:sass",
		"drop_fonts:publish",
		"cssmin:publish",
		"auto_install:publish",
		"electron-packager:allOfCurrentPlatform",
		"zip:build",
		"clean:publish",
		"clean:build",
	] );
};

