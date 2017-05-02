
var SC=µ.shortcut({
	xdccManager:require.bind(null,"../lib/xdccManager"),
    ircManager:require.bind(null,"../lib/IrcManager"),
    Download:require.bind(null,"../lib/NIWA-Downloads/Download")
});
var config=require("./config");

var FS=require("fs");


var getCredentials=function(network,nickname,password)
{
	return config.ready
	.then(function(config)
	{
		var networks=config.get("networks")
		var n=networks.get(network);
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

module.exports={
	connect:function(param)
	{
		if(param.method!="POST"||!param.data.host)
		{
			return Promise.reject('POST Json like:{host:"myHost"[,nickname:"myNick"[,password:"myPassword"]}');
		}
		else
		{
			return getCredentials(param.data.host,param.data.nickname,param.data.password)
			.then(function(credentials)
			{
				return SC.ircManager.connect(param.data.host,credentials.nickname,credentials.password);
			});
		}
	},
	message:function(param)
	{
		if(param.method!="POST"||!param.data.network||!param.data.target||!param.data.text)
		{
			return Promise.reject('POST Json like:{network:"myNetwork",target:"myTarget",text:"myText"}');
		}
		else
		{
			return SC.ircManager.message(param.data.network,param.data.target,param.data.text);
		}
	},
	join:function(param)
	{
		if(param.method!="POST"||!param.data.network||!param.data.channel)
		{
			return Promise.reject('POST Json like:{network:"myNetwork",channel:"myChannel"}');
		}
		else
		{
			return SC.ircManager.join(param.data.network,param.data.channel);
		}
	},
	whois:function(param)
	{
		if(param.method!="POST"||!param.data.network||!param.data.user)
		{
			return Promise.reject('POST Json like:{network:"myNetwork",user:"myUser"}');
		}
		else
		{
			return SC.ircManager.whois(param.data.network,param.data.user);
		}
	},
	dcc:function(param)
	{
		if(param.method!="POST"||!param.data.network||!param.data.user||!param.data.ip||!param.data.port||!param.data.filename)
		{
			return Promise.reject('POST Json like:{network:"myNetwork",user:"myUser",ip:"ip",port:"port",filepath:"filepath",filename:"filename"}');
		}
		else
		{
			return config.ready
			.then(function(config)
			{
				var download=new SC.Download({
					state:SC.Download.states.RUNNING,
					dataSource:{
						network:param.data.network,
						user:param.data.user,
						ip:param.data.ip,
						port:param.data.port,
					},
					filename:param.data.filename,
					filepath:param.data.filepath||config.get(["DCC","download folder"]).get()
				});
				var rtn=SC.xdccManager.download(download);
				if (Array.isArray(rtn))
				{
					return Promise.reject(rtn);
				}
			});
		}
	},
	xdcc:function(param)
	{
		if(param.method!="POST"||!param.data.network||!param.data.user||!param.data.packnumber)
		{
			return Promise.reject('POST Json like:{network:"myNetwork",user:"myUser",packnumber:1234}');
		}
		else
		{
			return config.ready
			.then(function(config)
			{
				var download=new SC.Download({
					state:SC.Download.states.RUNNING,
					dataSource:{
						network:param.data.network,
						user:param.data.user,
						packnumber:param.data.packnumber
					},
					filename:param.data.filename,
					filepath:param.data.filepath||config.get(["DCC","download folder"]).get()
				});
				return SC.xdccManager.request(download);
			});
		}
	}
}

config.ready.then(function(config)
{
	SC.ircManager;// load manager
	if(config.get("auto connect").get())
	{
		for (var entry of config.get("networks"))
		{
			var name=entry[0];
			var network=entry[1];

			if(network.get("auto connect").get())
			{
				getCredentials(name)
				.then(function(credentials)
				{
					return SC.ircManager.connect(name,credentials.nickname,credentials.password);
				})
				.catch(function(e)
				{
					µ.logger.error(e);
				});
			}
		}
	}
});