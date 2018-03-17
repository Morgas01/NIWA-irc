(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		Promise:"Promise",
		register:"register",
    	ircManager:require.bind(null,"./IrcManager"),
		Download:"NIWA-Download.Download",
		File:"File",
		FileUtil:"File.util",
		eq:"equals"
	});
	let NET=require("net");
	let DownloadManager=GMOD("NIWA-Download.Manager");

	let config=require("../rest/config");
	let dccRegister=SC.register(2); //holds dcc offers (server user [ip:port]=offer)
	let xdccRegister=SC.register(1); //holds xdcc requests (server [user]={download,signal})

	let xdccManager=new DownloadManager({
		storagePath:false,
		filter:function(running,download)
		{
			if(download.dataSource.packnumber && !download.dataSource.ip)
			{//XDCC
				let found=running.find(SC.eq.test({
					dataSource:{
						network:download.dataSource.network,
						user:download.dataSource.user
					}
				}));
				if(found) return Promise.reject(download.dataSource.user+"@"+download.dataSource.network+" is busy");
			}
			return true;
		},
		accept:function(download)
		{
			return checkXdccDownload(this,download);
		},
		autoTrigger:true
	});

	xdccManager.parseMessage=function(message,network,user)
	{
		let match=message.text.match(dccExp)
		if(match)
		{
			let offer={
				command:match[1],
				argument:match[2]||match[3],
				ip:parseIp(match[4]),
				port:match[5],
				rest:match[6]
			};
			dccRegister[network][user][offer.ip+":"+offer.port]=offer;

			switch(offer.command)
			{
				case "SEND":
					offer.filename=offer.argument;
					offer.filesize=parseInt(offer.rest,10)||null;

					let xdccRequest=xdccRegister[network][user];
					if(xdccRequest)
					{
						clearTimeout(xdccRequest.timer);
						delete xdccRegister[network][user];
						let download=xdccRequest.download;
						if(checkName(xdccRequest.download,offer))
						{
							if(!xdccRequest.download.filename)xdccRequest.download.filename=offer.filename;
							if(offer.filesize)xdccRequest.download.filesize=offer.filesize;
							xdccRequest.download.dataSource.ip=offer.ip;
							xdccRequest.download.dataSource.port=offer.port;
							this.downloadDCC(xdccRequest.signal,xdccRequest.download);
						}
						else
						{
							//TODO notify other apps for open offer
							let catchOffer=null
							if(xdccRequest.download.context)
							{
								catchOffer=worker.ask(xdccRequest.download.context,"openIrcOffer",{offer:offer,originalDownloadName:xdccRequest.download.name});
							}
							else
							{
								catchOffer=Promise.reject();
							}
							catchOffer.then(result=>
							{
								µ.logger.info({result:result},"catched offer");
							},
							e=>
							{
								µ.logger.info({error:e},"could not catch offer");
								SC.ircManager.message(network,user,"XDCC CANCEL");
							});
							this.dbConnector.then(dbc=>
							{
								download.addMessage("wrong filename: "+offer.filename);
								download.state=SC.Download.states.FAILED;
								xdccRequest.signal.resolve();
							});
						}
					}
					break;
				case "ACCEPT":
					offer.filename=offer.argument;
					offer.startPos=parseInt(offer.rest,10)||null;

					let sendOffer=dccRegister[network][user][offer.ip+":"+offer.port];
					if(sendOffer&&sendOffer.command==="SEND"&&sendOffer.filename===offer.filename&&sendOffer.resume)
					{
						sendOffer.startPos=offer.startPos;
						sendOffer.resume();
					}
					return null;
			}
			return offer;
		}
		return null;
	};
	xdccManager.download=function(signal,download)
	{
		if(download.dataSource.packnumber&&!download.dataSource.ip) xdccManager.downloadXDCC(signal,download);
		else xdccManager.downloadDCC(signal,download);
	};
	xdccManager.downloadXDCC=function(signal,xdccDownload)
	{
		return checkXdccDownload(this,xdccDownload)
		.then(()=>config.ready)
		.then(function(config)
		{
			let data={download:xdccDownload,signal:signal};
			let removeFN=function()
			{
				delete xdccRegister[xdccDownload.dataSource.network][xdccDownload.dataSource.user];
				SC.ircManager.message(xdccDownload.dataSource.network,xdccDownload.dataSource.user,"XDCC CANCEL");
				SC.ircManager.message(xdccDownload.dataSource.network,xdccDownload.dataSource.user,"XDCC REMOVE #"+xdccDownload.dataSource.packnumber);
				signal.reject("XDCC request timeout");
			};
			signal.addAbort(function()
			{
				if(xdccRegister[xdccDownload.dataSource.network][xdccDownload.dataSource.user]) removeFN();
			});
			xdccRegister[xdccDownload.dataSource.network][xdccDownload.dataSource.user]=data;
			let messagePromise=SC.ircManager.connect(xdccDownload.dataSource.network);
			if(xdccDownload.dataSource.channel)
				messagePromise=messagePromise.then(()=>SC.ircManager.join(xdccDownload.dataSource.network,xdccDownload.dataSource.channel));
			return messagePromise.then(()=>
			{
				data.timer=setTimeout(removeFN,config.get(["DCC","XDCC request timeout"]).get());
				return SC.ircManager.message(xdccDownload.dataSource.network,xdccDownload.dataSource.user,"XDCC SEND #"+xdccDownload.dataSource.packnumber);
			});
		})
		.catch(signal.reject);
	};
	xdccManager.downloadDCC=function(signal,download)
	{
		let check=checkDccDownload(download);
		if (check.length!=0) signal.reject(check);

		let userRegister=dccRegister[download.dataSource.network][download.dataSource.user];
		let offerKey=download.dataSource.ip+":"+download.dataSource.port;
		let offer=userRegister[offerKey];

		if(!offer) return signal.reject( ["no offer"]);
		if(offer.command!=="SEND") return signal.reject( ["wrong offer: "+offer.command]);

		download.state=SC.Download.states.RUNNING;
		new SC.Promise([
			config.ready,
			new SC.File(download.filepath).exists().then(µ.constantFunctions.scope,function(){return signal.reject("filepath does not exist: "+this.getAbsolutePath())})
		])
		.then((config,folder)=>
		{
			let targetFile=folder.clone().changePath(download.filename);
			let suffix=getConfigValue(config,download.dataSource.suffix,["DCC","suffix"])
			let partFile=suffix?folder.clone().changePath(download.filename+suffix):targetFile;
			let openStream;
			if(getConfigValue(config,download.dataSource.resume,["DCC","resume"]))
			{
				openStream=partFile.exists()
				.then(()=>partFile.stat())
				.then(stats=>(stats.size>0?stats:Promise.reject("empty file")))
				.then(stats=>new Promise((resolve,reject)=>
				{
					let resumeTimer=setTimeout(()=>
					{
						delete offer.resume;

						download.addMessage("resume timeout");
						this.updateDownload(download);
						partFile.writeStream().then(resolve,reject);
					},getConfigValue(config,download.dataSource.resumeTimeout,["DCC","resume timeout"]));
					offer.resume=()=>
					{
						clearTimeout(resumeTimer);
						download.addMessage("resume");
						this.updateDownload(download);
						partFile.writeStream({flags:"a"}).then(resolve,reject);
					};

					download.addMessage("try to resume");
					this.updateDownload(download);
					SC.ircManager.message(download.dataSource.network,download.dataSource.user,`DCC RESUME ${offer.filename} ${offer.port} ${stats.size}`);
				}),
				()=>partFile.writeStream());
			}
			else openStream=openStream=partFile.writeStream();

			return openStream.then((fileStream)=>
			{
				delete userRegister[offerKey];
				let updateTimer=null;
				let completeCounter=0;
				let received=0;
				let sendBuffer = new Buffer(4);
				let connection = NET.connect(download.dataSource.port, download.dataSource.ip,()=>
				{
					download.addMessage("connected");
					download.startTime=Date.now(); //reset download time
					this.updateDownload(download);
					updateTimer=setInterval(()=>
					{
						download.setSize(received);
						if(download.size===download.filesize)
						{
							if(completeCounter++==10)// ~5sec complete
							{
								connection.end();
								download.addMessage("end stalled connection");
							}
						}
						this.updateDownload(download);
					},490);
				});
				connection.pipe(fileStream);

				//send acknowledgements
				connection.on('data', function(data)
				{
					received += data.length;

					/* TODO Large file support ???
					received += data.length;
					while (received > 0xFFFFFFFF)
					{
						received -= 0xFFFFFFFF;
					}
					*/
					sendBuffer.writeUInt32BE(received, 0);
					connection.write(sendBuffer);
                });

				let onError=(error)=>
				{
					clearInterval(updateTimer);
					fileStream.end();
					µ.logger.error({error:error});
					download.addMessage("error");
					download.state=SC.Download.states.FAILED;
					signal.reject(error);
				};
				fileStream.on("error",onError);
				connection.on("error",onError)
				.on("end",()=>
				{
					clearInterval(updateTimer);
					partFile.stat()
					.then((stats)=>
					{
						if(stats.size!=offer.filesize)
						{
							download.addMessage("Connection interrupted");
							download.state=SC.Download.states.FAILED;
							return Promise.reject("Connection interrupted");
						}
						download.addMessage("complete");
						download.state=SC.Download.states.DONE;
						if(targetFile!==partFile)
						{
							return SC.FileUtil.findUnusedName(targetFile)
							.then(()=>
							{
								return partFile.rename(targetFile.getName()).then(()=>
								{
									download.filename=partFile.getName();
								});
							});
						}
					})
					.then(signal.resolve,signal.reject);

					connection.destroy();
				});

				signal.addAbort(function()
				{
					SC.ircManager.message(download.dataSource.network,download.dataSource.user,"XDCC CANCEL");
					connection.removeAllListeners("error");
					setTimeout(()=>connection.end(),250);
				});
			},signal.reject);
		})
		.catch(signal.reject);
	};

    // matches: DCC {command} {argument} {ip} {port} {rest}
	let dccExp=/DCC (\w+) (?:['"](.+)["']|(\S+)) ([\d:a-fA-F]+) (\d+)\s*(.*)/;
	let parseIp=function(numberString)
	{
		if(numberString.indexOf(":")!=-1) return numberString // IPv6
		let number=parseInt(numberString,10);
		let ip=(number&255);
		ip=((number>>8)&255)+"."+ip;
		ip=((number>>16)&255)+"."+ip;
		ip=((number>>24)&255)+"."+ip;
		return ip;
	};
	let checkDccDownload=function(download)
	{
		let errors=[];

		if(!download.dataSource.network) errors.push("no network");
		if(!download.dataSource.user) errors.push("no user");
		if(!download.dataSource.ip) errors.push("no ip");
		if(!download.dataSource.port) errors.push("no port");
		if(!download.filepath) errors.push("no filepath");
		if(!download.filename) errors.push("no filename");

		return errors;
	};
	let checkXdccDownload=function(manager,download)
	{
		let errors=[];

		if(!download.dataSource.network) errors.push("no network");
		if(!download.dataSource.user) errors.push("no user");
		if(!download.dataSource.packnumber) errors.push("no ip");
		if(!download.filepath) errors.push("no filepath");

		if(errors.length>0) return Promise.reject(errors);
		return Promise.resolve(true);
	};
	let ignoreRegex=/[\s\._'"`´]+/g;
	let checkName=function(download,offer)
	{
		return !download.dataSource.checkName|| //no check
		download.dataSource.checkName==offer.filename|| //same
		download.dataSource.checkName.replace(ignoreRegex,"").toLowerCase()==offer.filename.replace(ignoreRegex,"").toLowerCase(); //similar
	};
	let getConfigValue=function(config,downloadValue,pathKeys)
	{
		let field=config.get(pathKeys);
		if(!field) return downloadValue;
		if(downloadValue==null||!field.isValid(downloadValue)) return field.get();
		return downloadValue;
	}

	module.exports=xdccManager;

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);