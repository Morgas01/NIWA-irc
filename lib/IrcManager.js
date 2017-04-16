(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		irc:require.bind(null,"irc"),
		messageUtils:require.bind(null,"../js/messageUtils"),
		prom:"Promise"
	});

	/** @type {Map.<String,IrcClient>} */
	var clients=new Map();

	var CONNECTION_TIMEOUT=30000;
	var TYPES={
		ERROR:"ERROR",
		RAW:"RAW",
		MESSAGE:"MESSAGE",
		TOPIC:"TOPIC",
		WHOIS:"WHOIS",
		NOTICE:"NOTICE",
		INFO:"INFO"
	};

	var manager=module.exports={
		data:{},
		connect:function(network,user,password)
		{
			return createClient(network,user,password).then(function(client)
			{
				if (client.conn.readystate=="closed")
				{
					client.connect();
					//TODO callback
				}
			})
		},
		message:function(network,target,text)
		{
			if(!clients.has(network)) return Promise.reject("not connected ("+network+")");
			clients.get(network).then(c=>c.say(target,text));
		},
		join:function(network,channel)
		{
			if(!clients.has(network)) reject("not connected ("+network+")");
			clients.get(network).then(function(client)
			{
				var lowerChannel=channel.toLowerCase();

				var index=Object.keys(client.chans).findIndex(function(chan)
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
			if(!clients.has(network)) return Promise.reject("not connected ("+network+")");
			clients.get(network).then(c=>c.whois(user));
		}
	};

	worker.event("irc",manager.data,"init");

	var createClient=function(network,user,password)
		{
			if(!clients.has(network))
			{
				clients.set(network,new Promise(function(resolve,reject)
				{
					var newClient= new SC.irc.Client(network,user,{password:password});

					addMessage(newClient,null,null,`trying to connect to ${network} as ${user} with${password?'':'out'} password`);

					var timer=setTimeout(function()
					{
						clients.delete(network);
						newClient.removeAllListeners();
						newClient.once('registered', function()
						{
							newClient.disconnect();
						});
						reject("timeout");
					},CONNECTION_TIMEOUT);

					newClient.once('registered', function()
					{
						clearTimeout(timer);
						resolve(newClient);
					});

					registerEvents(network,newClient);

				}));
			}
			return clients.get(network);
		}

	var registerEvents=function(network,newClient)
	{
		newClient.on('error', function(msg)
		{
			addMessage(newClient,null,null,message,TYPES.ERROR);
		});
		newClient.on('message', function(nick, to, text, message)
		{
			addMessage(newClient,nick,to,text,TYPES.MESSAGE);
		});
		newClient.on('selfMessage', function()
		{
			addMessage(newClient,newClient.nick,to,text,TYPES.MESSAGE);
		});

		newClient.on('topic', function(channel, topic, nick)
		{
			addMessage(newClient,nick,channel,topic,TYPES.TOPIC);
			setTopic(newClient,channel,topic);
		});
		newClient.on('motd', function(motd)
		{
			addMessage(newClient,null,null,motd,TYPES.MESSAGE);
		});
		newClient.on('names', function(channel,names)
		{
			setUserList(newClient,channel,names);
		});
		newClient.on('notice', function(nick, to, text)
		{
			addMessage(newClient,nick,to,text,TYPES.NOTICE);
		});
		newClient.on('whois', function(info)
		{
			addMessage(newClient,null,info.nick,JSON.stringify(info,null,"\t"),TYPES.WHOIS);
		});
		var welcomeCommands=["rpl_welcome","rpl_yourhost","rpl_created","rpl_luserclient","rpl_luserop","rpl_luserchannels","rpl_luserme","rpl_localusers","rpl_globalusers","rpl_statsconn","rpl_luserunknown","396","042"];
		newClient.on('raw', function(rawMessage)
		{
			//addMessage(newClient,rawMessage.nick,null,JSON.stringify(rawMessage,null,"\t"),TYPES.RAW);
			if (welcomeCommands.indexOf(rawMessage.command)!=-1)
			{
				addMessage(newClient,null,null,rawMessage.args.slice(1).join("\t"),TYPES.INFO);
			}
		});
		/*
		newClient.on('', function()
		{

		});
		*/
	};
	var getData=function(client,target)
	{
    	if(!(client.opt.server in manager.data))manager.data[client.opt.server]={messages:[]};
    	var data=manager.data[client.opt.server];

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
	var addMessage=function(client,sender,receiver,text,type)
    {
    	var target= (receiver&&client.nick.toLowerCase()==receiver.toLowerCase())?sender:receiver;

    	var msg={
    		user:sender,
    		text:text,
    		type:type,
    		time:Date.now()
    	};

    	var data=getData(client,target);
		data.messages.push(msg);

    	worker.event("irc",manager.data,"message",{
    		server:client.opt.server,
    		target:target,
    		user:sender,
    		text:text,
    		type:type,
    		time:msg.time
    	});
    };
    var setTopic=function(client,channel,topic)
    {
		getData(client,channel).topic=topic;
    	worker.event("irc",manager.data,"topic",{
    		server:client.opt.server,
    		channel:channel,
    		topic:topic
    	});
    };
    var setUserList=function(client,channel,names)
    {
    	getData(client,channel).userList=names;
    	worker.event("irc",manager.data,"userList",{
    		server:client.opt.server,
    		channel:channel,
    		userList:names
    	});
    };

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);