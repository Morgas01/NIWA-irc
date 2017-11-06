(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		irc:require.bind(null,"irc"),
		xdccManager:require.bind(null,"./xdccManager"),
		adopt:"adopt",
		Promise:"Promise"
	});

	let config=require("../rest/config");
	let messageUtils=require("../js/messageUtils");

	/** @type {Map.<String,IrcClient>} */
	let clients=new Map();

	let CONNECTION_TIMEOUT=30000;
	let TYPES={
		ERROR:"ERROR",
		RAW:"RAW",
		MESSAGE:"MESSAGE",
		TOPIC:"TOPIC",
		WHOIS:"WHOIS",
		NOTICE:"NOTICE",
		CTCP:"CTCP",
		INVITE:"INVITE",
		ACTION:"ACTION",
		INFO:"INFO"
	};
	let getCredentials=function(network,nickname,password)
    {
    	return config.ready
    	.then(function(config)
    	{
    		let networks=config.get("networks")
    		let n=networks.get(network);
    		if(!n)
    		{
    			n=networks.add(network);
    		}
    		if(nickname)
    		{
    			n.set("nickname",nickname);
    			n.set("password",password||null);
    			config.save();
    		}
    		nickname=n.get("nickname").get();
    		if(!nickname) nickname=config.get("nickname").get();
    		if(!nickname) return Promise.reject("no credentials");
    		return {nickname:nickname,password:null};//n.get("password").get()};
    	});
    };
	let clientDisconnected=client=>client.conn.readystate=="closed";

	let manager=module.exports={
		data:{},
		connect:function(network,user,password,reconnect)
		{
			if(clients.has(network))
			{
				if(reconnect)
				{
					return clients.get(network).then(function(client)
					{
						if(clientDisconnected(client)) return Promise.reject("client already connected: "+network);
						client.end();
						clients.delete(network);
						return createClient(network,user,password);
					});
				}
				return clients.get(network);
			}
			return createClient(network,user,password);
		},
		message:function(network,target,text)
		{
			return getClient(network).then(function(client)
			{
				client.say(target,text);
			});
		},
		join:function(network,channel)
		{
			return getClient(network).then(function(client)
			{
				let lowerChannel=channel.toLowerCase();

				let index=Object.keys(client.chans).findIndex(function(chan)
				{
					return lowerChannel==chan.toLowerCase();
				});
				if (index==-1)
				{
					return new Promise(rs=>client.join(channel,rs));
				}
			});
		},
		whois:function(network,user)
		{
			return getClient(network).then(function(client)
			{
				client.whois(user);
			});
		}
	};

	let notify=worker.eventSource("irc",()=>manager.data);

	let createClient=function(network,user,password)
	{
		if(!clients.has(network))
		{
			let clienPromise=new SC.Promise([getCredentials(network,user,password),config.ready])
			.then(function(credentials,config)
			{
				µ.logger.info({credentials:credentials},"trying to connect to "+network);
				return new Promise(function(resolve,reject)
				{
					let newClient=new SC.irc.Client(network,credentials.nickname,{
						password:credentials.password,
						channels:config.get(["networks",network,"channels"]).keys()
					});
					addMessage(newClient,null,null,`trying to connect to ${network} as ${credentials.nickname} with${credentials.password?'':'out'} password`);

					let timer=setTimeout(function()
					{
						clients.delete(network);
						newClient.removeAllListeners();
						newClient.once('registered', function()
						{
							newClient.disconnect();
						});
						reject("irc connect timeout");
					},CONNECTION_TIMEOUT);

					newClient.once('registered', function()
					{
						µ.logger.info("connected to "+network);
						clearTimeout(timer);
						resolve(newClient);

					});

					registerEvents(network,newClient);
				});
			});
			clients.set(network,clienPromise);
			clienPromise.catch(function()
			{
				clients.delete(network);
			})
			return clienPromise;
		}
		return Promise.reject("client exists: "+network);
	};

	let getClient=function(network)
	{
		if(!clients.has(network)) return Promise.reject("client does not exist: "+network);
		return clients.get(network)
		.then(function(client)
		{
			if(clientDisconnected(client)) return Promise.reject("client disconnected: "+network);
			return client;
		});
	}

	let registerEvents=function(network,newClient)
	{
		let welcomeCommands=["rpl_welcome","rpl_yourhost","rpl_created","rpl_luserclient","rpl_luserop","rpl_luserchannels","rpl_luserme","rpl_localusers","rpl_globalusers","rpl_statsconn","rpl_luserunknown","396","042","rpl_isupport"];

		newClient
		.on('error', function(message)
		{
			if(message.rawCommand=="401")//no such nick
			{
				//TODO cancel xdcc
			}
			addMessage(newClient,null,null,JSON.stringify(message,null,"\t"),TYPES.ERROR);
		})
		.on('message', function(nick, to, text, message)
		{
			addMessage(newClient,nick,to,text,TYPES.MESSAGE);
		})
		.on('selfMessage', function(to, text)
		{
			addMessage(newClient,newClient.nick,to,text,TYPES.MESSAGE);
		})
		.on('topic', function(channel, topic, nick)
		{
			addMessage(newClient,nick,channel,topic,TYPES.TOPIC);
			setTopic(newClient,channel.toLowerCase(),topic);
		})
		.on('motd', function(motd)
		{
			addMessage(newClient,null,null,motd,TYPES.MESSAGE);
		})
		.on('names', function(channel,names)
		{
			setUserList(newClient,channel.toLowerCase(),names);
		})
		.on('notice', function(nick, to, text)
		{
			addMessage(newClient,nick,to,text,TYPES.NOTICE);
		})
		.on('whois', function(info)
		{
			addMessage(newClient,null,info.nick,JSON.stringify(info,null,"\t"),TYPES.WHOIS);
		})
		.on('ctcp', function(from, to, text, type)
		{
			addMessage(newClient,from,to,text,TYPES.CTCP+" "+type);
		})
		.on('raw', function(rawMessage)
		{
			//addMessage(newClient,rawMessage.nick,null,JSON.stringify(rawMessage,null,"\t"),TYPES.RAW);
			if (welcomeCommands.indexOf(rawMessage.command)!=-1)
			{
				addMessage(newClient,null,null,rawMessage.args.slice(1).join("\t"),TYPES.INFO);
			}
		})
		.on('join', function(channel, nick)
		{
			addMessage(newClient,null,channel,`${nick} has joined`,TYPES.INFO+" join");
		})
		.on('part', function(channel, nick, reason)
		{
			addMessage(newClient,null,channel,`${nick} has parted${reason?": "+reason:""}`,TYPES.INFO+" part");
		})
		.on('kick', function(channel, nick, by, reason)
		{
			addMessage(newClient,null,channel,`${nick} was kicked by ${by}${reason?": "+reason:""}`,TYPES.INFO+" kick");
		})
		.on('quit', function(nick, reason, channels)
		{
			for(let channel of channels) addMessage(newClient,null,channel,`${nick} has quit${reason?": "+reason:""}`,TYPES.INFO+" quit");
		})
		.on('kill', function(nick, reason, channels)
		{
			for(let channel of channels) addMessage(newClient,null,channel,`${nick} was killed${reason?": "+reason:""}`,TYPES.INFO+" kill");
		})
		.on('invite', function(channel, from)
		{
			addMessage(newClient,from,channel,`invite to ${channel}`,TYPES.INFO+" invite");
		})
		.on('action', function(from, to, text)
		{
			addMessage(newClient,from,to,text,TYPES.ACTION);
		});
		/* TODO?
		newClient.on('+mode', function()
		{
			addMessage(newClient,null,channel,`${nick} has joined`,TYPES.INFO);
		});
		newClient.on('-mode', function()
		{
			addMessage(newClient,null,channel,`${nick} has joined`,TYPES.INFO);
		});

		newClient.on('', function()
		{

		});
		*/

		let autoCommand=function(commands)
		{
			for (let entry of commands)
			{
				let command=entry[1];
				switch(command.get("command").get())
				{
					case "message":
						newClient.say(command.get("target").get(),command.get("parameter").get());
						break;
					case "whois":
						newClient.whois(command.get("target").get());
						break;
				}
			}
		};
		config.ready
		.then(c=>c.get(["networks",newClient.opt.server]))
		.then(function(networkConfig)
		{
			newClient.on('registered',function()
			{
				autoCommand(networkConfig.get("connect commands"));
			})
			.on('join',function(channel, nick)
			{
				if(nick==newClient.nick)
				{
					let channelsConfig=networkConfig.get("channels");
					let channelConfig=channelsConfig.get(channel.toLowerCase());
					if(!channelConfig) channelsConfig.add(channel.toLowerCase());
					else autoCommand(channelConfig.get("join commands"));
				}
			})
		});
	};
	let getData=function(client,target)
	{
    	if(!(client.opt.server in manager.data)) manager.data[client.opt.server]={messages:[]};
    	let data=manager.data[client.opt.server];

    	if(!target)
    	{
    		return data;
    	}
    	else
    	{
    		if(!data.targets) data.targets={};
    		if(!data.targets[target]) data.targets[target]={messages:[]};
    		return data.targets[target];
    	}
	}
	let addMessage=function(client,sender,receiver,text,type)
    {
    	let nick = (client.nick||client.opt.nick).toLowerCase();
    	if (receiver&&messageUtils.isChannel(receiver))
    	{
    		receiver=receiver.toLowerCase();
    	}
    	let target=(receiver&&nick==receiver.toLowerCase())?sender:receiver;

    	let message={
    		user:sender,
    		text:text,
    		type:type,
    		time:Date.now()
    	};

    	if(type==TYPES.CTCP+" privmsg") message.dcc=SC.xdccManager.parseMessage(message,client.opt.server,sender);

    	let data=getData(client,target);
		data.messages.push(message);

		let eventMessage=SC.adopt({
			server:client.opt.server,
			target:target
		},message,true);
    	notify("message",eventMessage);
    };
    let setTopic=function(client,channel,topic)
    {
		getData(client,channel).topic=topic;
    	notify("topic",{
    		server:client.opt.server,
    		channel:channel,
    		topic:topic
    	});
    };
    let setUserList=function(client,channel,names)
    {
    	getData(client,channel).userList=names;
    	notify("userList",{
    		server:client.opt.server,
    		channel:channel,
    		userList:names
    	});
    };

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);