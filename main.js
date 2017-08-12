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

const { app: App, BrowserWindow, dialog: Dialog } = require( "electron" );

const Path = require( "path" );
const Url = require( "url" );

const Calliope = require( "./lib/calliope" );


let win;

function createWindow( calliope ) {
	win = new BrowserWindow( {
		width: 800,
		height: 600,
		show: false,
	} );

	Dialog.showMessageBox( win, {
		message: calliope.detailsFilename,
		title: calliope.pathname,
	} );

	win.setMenu( null );

	win.loadURL( Url.format( {
		pathname: Path.resolve( __dirname, "index.html" ),
		protocol: "file",
		slashes: true,
		defaultFont: "sans-serif",
	} ) );

	//win.webContents.openDevTools();

	win.once( "ready-to-show", () => win.show() );

	win.on( "closed", () => {
		win = null;
	} );

	win.webContents.session.on( "will-download", ( event, item ) => {
		item.setSavePath( Path.resolve( calliope.pathname, "mini.hex" ) );
	} );

	win.webContents.on( "new-window", ( event, url ) => {
		event.preventDefault();
		win.loadURL( url );
	} );
}

App.on( "ready", () => {
	Calliope.find()
		.then( createWindow, error => {
			Dialog.showMessageBox( {
				type: "error",
				message: error.message,
				title: "Starting Calliope Editor failed.",
			}, () => App.quit() );
		} );
} );

App.on( "window-all-closed", () => {
	if ( process.platform !== "darwin" ) {
		App.quit();
	}
} );

App.on( "activate", () => {
	if ( win === null ) {
		createWindow();
	}
} );
