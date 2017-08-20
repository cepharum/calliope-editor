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

module.exports = function( grunt ) {

	grunt.initConfig( {
		clean: {
			publish: [ ".publish" ],
			build: [ ".build/**/*", "!.build/*.zip" ],
		},
		copy: {
			publish:{
				files: [
					{
						expand: true,
						src: [
							"assets/**",
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
			win32_32: {
				options: {
					platform: "win32",
					arch: "ia32",
					dir: ".publish",
					out: ".build",
					name: "calliope-editor",
					asar: true,
					overwrite: true,
				},
			},
			win32_64: {
				options: {
					platform: "win32",
					arch: "x64",
					dir: ".publish",
					out: ".build",
					name: "calliope-editor",
					asar: true,
					overwrite: true,
				},
			},
			macos_64: {
				options: {
					platform: "darwin",
					arch: "x64",
					dir: ".publish",
					out: ".build",
					name: "calliope-editor",
					asar: true,
					overwrite: true,
				},
			},
		},
		zip: {
			win32_32: {
				cwd: ".build/calliope-editor-win32-ia32/",
				src: [".build/calliope-editor-win32-ia32/**"],
				dest: ".build/calliope-editor-win32-ia32.zip",
			},
			win32_64: {
				cwd: ".build/calliope-editor-win32-x64/",
				src: [".build/calliope-editor-win32-x64/**"],
				dest: ".build/calliope-editor-win32-x64.zip",
			},
			macos_64: {
				cwd: ".build/calliope-editor-darwin-x64/",
				src: [".build/calliope-editor-darwin-x64/**"],
				dest: ".build/calliope-editor-macos-x64.zip",
			},
		},
	} );

	grunt.loadNpmTasks( "grunt-contrib-clean" );
	grunt.loadNpmTasks( "grunt-contrib-copy" );
	grunt.loadNpmTasks( "grunt-auto-install" );
	grunt.loadNpmTasks( "grunt-electron-packager" );
	grunt.loadNpmTasks( "grunt-zip" );

	grunt.registerTask( "publish", [
		"clean:publish",
		"clean:build",
		"copy:publish",
		"auto_install:publish",
		"electron-packager:win32_32",
		"electron-packager:win32_64",
		"electron-packager:macos_64",
		"zip:win32_32",
		"zip:win32_64",
		"zip:macos_64",
		"clean:publish",
		"clean:build",
	] );
};

