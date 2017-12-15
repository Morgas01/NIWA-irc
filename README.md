# NIWA-irc
IRC application for [NIWA](https://github.com/Morgas01/NIWA)


##Deployment
This package is meant to be [deployed](https://www.npmjs.com/package/niwa#apps) on a [NIWA](https://www.npmjs.com/package/niwa) server.

Download or clone it from [github](https://github.com/Morgas01/NIWA-irc) or install from npm `npm install @niwa/irc`


##Manual
######Connecting to an IRC server

Just type in the host and your nickname and click the connect button.
You can always return the the "new connection" tab by clicking the `➕` symbol.

######Configuration
You can configure a default nickname for any new hosts or those you have no nickname set specifically.
If first `auto connect` option is disabled no server will be automatically connected.

DCC options for downloads:
-	download folder: if unset no downloads can be started
-	suffix: file suffix while downloading
-	resume: resume downloads if possible
-	resume timeout: time to wait in **ms** for resume acknowledgement *(if this is to long offers can timeout)*
-	XDCC request timeout: time to wait in **ms** for XDCC request acknowledgement *(if this is to short offers can get 	jumbled)*

######Server wise configuration
Add a host by fillng the input field and click `+`

######Commands
Click the `❓` button or type `/help` for a full command list