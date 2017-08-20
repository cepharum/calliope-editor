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

const {
	app: App,
	BrowserWindow,
	dialog: Dialog,
	session: Session,
} = require( "electron" );

const Path = require( "path" );
const File = require( "fs" );
const Url = require( "url" );

const Calliope = require( "./lib/calliope" );
const Html = require( "./lib/html" );
const Locale = require( "./lib/locale" );


let mainWindow, splashWindow;

function createWindow( calliope ) {
	/*
	 * Create splash window to appear until content of main window has been
	 * loaded.
	 */
	splashWindow = new BrowserWindow( {
		width: 200,
		height: 200,
		show: false,
		frame: false,
		fullscreenable: false,
		resizable: false,
		center: true,
		transparent: true,
	} );

	splashWindow.setMenu( null );

	File.readFile( Path.resolve( __dirname, "package.json" ), ( error, content ) => {
		if ( error ) {
			console.error( "missing package.json" );
			return App.quit();
		}

		const pkg = JSON.parse( content );

		Html.fileToDataUri( Path.resolve( __dirname, "splash.html" ), { version: pkg.version } )
			.then( uri => splashWindow.loadURL( uri, {
				baseURLForDataURL: Url.format( {
					protocol: "file",
					pathname: __dirname,
					slashes: true,
				} ) + "/"
			} ) );
	} );

	splashWindow.once( "ready-to-show", () => splashWindow.show() );
	splashWindow.on( "closed", () => splashWindow = null );


	/*
	 * Create main window and load website containing editor code.
	 */
	mainWindow = new BrowserWindow( {
		width: 1024,
		height: 768,
		show: false,
		webPreferences: {
			session: Session.fromPartition( "persist:calliope-editor", {
				cache: true
			} ),
		}
	} );

	mainWindow.setMenu( null );

	mainWindow.loadURL( "https://pxt.calliope.cc/" );

	mainWindow.once( "ready-to-show", () => {
		splashWindow.close();
		mainWindow.show();
	} );

	mainWindow.on( "closed", () => mainWindow = null );


	/*
	 * customize content of main window
	 */
	let content = mainWindow.webContents;

	// content.openDevTools();

	// always store downloads in folder detected to be provided by Calliope
	content.session.on( "will-download", ( event, item ) => {
		item.setSavePath( Path.resolve( calliope.pathname, "mini.hex" ) );
	} );

	// always open requested URL in main window rather than opening new window
	content.on( "new-window", ( event, url ) => {
		event.preventDefault();
		mainWindow.loadURL( url );
	} );
}

App.on( "ready", findDevice );

App.on( "window-all-closed", () => {
	if ( process.platform !== "darwin" ) {
		App.quit();
	}
} );

App.on( "activate", () => {
	if ( mainWindow === null ) {
		createWindow();
	}
} );



function findDevice(){
	Calliope.find()
		.then( createWindow, error => {
			Dialog.showMessageBox( {
				type: "error",
				message: error.message,
				title: Locale.current.map.FAILED_START_TITLE,
				buttons: [
					Locale.current.map.BTN_YES,
					Locale.current.map.BTN_NO,
				]
			}, clickedButtonIndex => clickedButtonIndex > 0 ? App.quit() : setImmediate( findDevice ) );
		} );
}
