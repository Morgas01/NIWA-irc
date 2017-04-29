(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		Promise:"Promise",
		register:"register",
		Download:require.bind(null,"./NIWA-Download/Download")
	});
	var DownloadManager=require("./NIWA-Download/Manager");

	var ircManager=require("./IrcManager");
	var dccRegister=SC.register(3); //holds dcc offers (server user ip:port)

	var xdccManager=new DownloadManager({
		storagePath:false
	});

	xdccManager.parseMessage=function(message,network,user)
	{
		var match=message.text.match(dccExp)
		if(match)
		{
			var offer={
				command:match[1],
				argument:match[2]||match[3],
				ip:parseIp(match[4]),
				port:match[5],
				rest:match[6]
			};
			switch(offer.command)
			{
				case "SEND":
					offer.filename=offer.argument;
					offer.filesize=parseInt(offer.rest,10)||null;

					this.dbConnector.then(dbc=>
						dcc.load(SC.Download,{
							dataSource:{
								network:network,
								user:user,
								waiting:true
							}
						})
						.then(results=>
						{
							if(results.length>0)
							{
								var download=results[0];
								download.dataSource.waiting=false;
								if(checkName(download,offer))
								{
									if(!download.filename)download.filename=offer.filename;
									if(offer.filesize)download.filesize=offer.filesize;
									download.dataSource.ip=offer.ip;
									download.dataSource.port=offer.port;
									dbc.save(download).catch(e=>µ.logger.error({error:e},"failed to save accepted xdcc offer"));
									var check=this.download(download);
									if(Array.isArray(check)) µ.logger.error("failed to download xdcc offer",check);
								}
								else
								{
									return dbc.save(download).catch(e=>µ.logger.error({error:e},"failed to save declined xdcc offer"));
								}
							}
							// TODO ask apps about the offer
						});
					);
					break;
				case "ACCEPT":
					offer.filename=offer.argument;
					offer.startPos=parseInt(offer.rest,10)||null;

					var sendOffer=dccRegister[network][user][offer.ip+":"+offer.port];
					if(sendOffer&&sendOffer.command==="SEND"&&sendOffer.filename===offer.filename&&sendOffer.resume)
					{
						sendOffer.startPos=offer.startPos;
						sendOffer.resume();
					}
					return null;
			}

			dccRegister[network][user][offer.ip+":"+offer.port]=offer;
			return offer;
		}
		return null;
	};
	xdccManager.request=function(xdccDownload)
	{
		var check=checkXdccDownload(xdccDownload);
		if (check.length!=0) return check;

		xdccDownload.dataSource.waiting=true;
		return xdccManager.add(xdccDownload)
		.then(()=>ircManager.message(xdccDownload.dataSource.network,xdccDownload.dataSource.user,"XDCC SEND #"+xdccDownload.dataSource.packnumber));
	};
	xdccManager.download=function(download)
	{
		var check=checkDccDownload(download);
		if (check.length!=0) return check;

		var userRegister=dccRegister[download.dataSource.network][download.dataSource.user];
		var offerKey=download.dataSource.ip+":"+download.dataSource.port;
		var offer=userRegister[offerKey];

		if(!offer) return ["no offer"];
		if(offer.command!=="SEND") return ["wrong offer: "+offer.command];
		if(download.dataSource.checkName&&download.dataSource.checkName!=offer.filename) return ["wrong filename: "+offer.filename];
		var downloadPromise=new SC.Promise(function(signal)
		{
			xdccManager.add(download);
			new SC.File(offer.filepath).exists()
			.then(function()
			{
				var targetFile=this.clone().changePath(download.filename);
				var partFile=download.suffix?this.clone().changePath(download.filename+download.dataSource.suffix):targetFile;
				var openStream;
				if(download.dataSource.resume)
				{
					openStream=new Promise(function(resolve,reject)
					{
						//TODO ask resume
						download.addMessage("try to resume");

						var resumeTimer=setTimeout(function()
						{
							delete offer.resume;
							download.addMessage("resume timeout");
							partFile.writeStream().then(resolve,reject);
						},download.dataSource.resumeTimeout);
						offer.resume=function()
						{
							clearTimeout(resumeTimer);
							download.addMessage("resume");
							partFile.writeStream({flags:"a"}).then(resolve,reject);
						};
					});
				}
				else openStream=openStream=partFile.writeStream();

				return openStream.then(function(fileStream)
				{
					delete userRegister[offerKey];
					var connection = net.connect(download.dataSource.port, download.dataSource.ip, function ()
					{
						//TODO update
						download.addMessage("connected");
					});
					connection.pipe(fileStream);

					var onError=function(error)
					{
						fileStream.end();
						µ.logger.error({error:error});
						//TODO update
						download.addMessage("error");
						signal.reject(error);
					};
					fileStream.on("error",onError);
					connection.on("error",onError)
					.on("end",function()
					{
						//TODO check filesize
						download.addMessage("complete");
						//TODO rename
						signal.resolve();
					})
				},signal.reject);
			},
			function()
			{
				signal.reject.reject("filepath does not exist: "+this.getAbsolutePath());
			});
		});

		return downloadPromise;
	};

    // matches: DCC {command} {argument} {ip} {port} {rest}
	var dccExp=/DCC (\w+) (?:['"](.+)["']|(\S+)) ([\d:a-fA-F]+) (\d+)\s*(.*)/;
	var parseIp=function(numberString)
	{
		var number=parseInt(numberString,10);
		return(number&255)+"."+
		((number>>8)&255)+"."+
		((number>>16)&255)+"."+
		((number>>24)&255);
	};
	var checkDccDownload=function(download)
	{
		var errors=[];

		if(!download.dataSource.network) errors.push("no network");
		if(!download.dataSource.user) errors.push("no user");
		if(!download.dataSource.ip) errors.push("no ip");
		if(!download.dataSource.port) errors.push("no port");
		if(!download.filepath) errors.push("no filepath");
		if(!download.filename) errors.push("no filename");

		return errors;
	};
	var checkXdccDownload=function(download)
	{
		var errors=[];

		if(!download.dataSource.network) errors.push("no network");
		if(!download.dataSource.user) errors.push("no user");
		if(!download.dataSource.packnumber) errors.push("no ip");
		if(!download.filepath) errors.push("no filepath");

		return errors;
	};
	var ignoreRegex=/[\s\._]+/g;
	var checkName=function(download,offer)
	{
		return !download.dataSource.checkName|| //no check
		download.dataSource.checkName==offer.filename|| //same
		download.dataSource.checkName.replace(ignoreRegex,"")==offer.filename.replace(ignoreRegex,""); //similar
	};

	module.exports=xdccManager;

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);