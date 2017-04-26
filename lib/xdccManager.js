(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		Promise:"Promise",
		register:"register"
	});

	var dccRegister=SC.register(3); //holds dcc offers (server user ip:port)
	var downloadRegister=SC.register(2,Set); //holds active downloads (server user)
	var downloads=[];

	var xdccManager={

		parseMessage:function(message,network,user)
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

						var xdccRequest=dccRegister[network][user][offer.ip+":"+offer.port];
						if(xdccRequest&&xdccRequest.command==="xdcc")
						{
							xdccRequest.download.dataSource.ip=offer.ip;
							xdccRequest.download.dataSource.port=offer.port;
							if(offer.filesize) xdccRequest.download.filesize=offer.filesize;
							xdccManager.download(xdccRequest.download);
							offer.accepted="xdcc";
						}
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
		},
		request:function(xdccDownload)
		{

		},
		download:function(download)
		{
			var check=checkDccDownload(download);
			if (check.length!=0) return check;

			var userRegister=dccRegister[download.network][download.user];
			var offerKey=download.ip+":"+download.port;
			var offer=userRegister[offerKey];

			if(!offer) return ["no offer"];
			if(offer.command!=="SEND") return ["wrong offer: "+offer.command];
			if(download.checkName&&download.checkName!=offer.filename) return ["wrong filename: "+offer.filename];
			var downloadPromise=new SC.Promise(function(signal)
			{
				new SC.File(offer.filepath).exists()
				.then(function()
				{
					var targetFile=this.clone().changePath(download.filename);
					var partFile=download.suffix?this.clone().changePath(download.filename+download.suffix):targetFile;
					var openStream;
					if(download.resume)
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
							},download.resumeTimeout);
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
						var connection = net.connect(download.port, download.ip, function ()
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
			var downloadsSet=downloadRegister[download.network][download.user];
			downloadsSet.add(downloadPromise);
			downloadPromise.always(function()
			{
				downloadsSet.delete(downloadPromise);
			});
			return downloadPromise;
		}
	}

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

	module.exports=xdccManager;

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);