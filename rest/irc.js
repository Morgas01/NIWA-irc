
var config=require("./config");
var ircManager=require("../lib/IrcManager");
var xdccManager=require("../lib/xdccManager");

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
				return ircManager.connect(param.data.host,credentials.nickname,credentials.password);
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
			return ircManager.message(param.data.network,param.data.target,param.data.text);
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
			return ircManager.join(param.data.network,param.data.channel);
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
			return ircManager.whois(param.data.network,param.data.user);
		}
	},
	dcc:function(param)
	{
		if(param.method!="POST"||!param.data.network||!param.data.user||!param.data.ip||!param.data.port||!param.data.filepath||!param.data.filename)
		{
			return Promise.reject('POST Json like:{network:"myNetwork",user:"myUser",ip:"ip",port:"port",filepath:"filepath",filename:"filename"}');
		}
		else
		{
			var download=param.data; //TODO
			var rtn=xdccManager.download(download);
			if (Array.isArray(rtn))
			{
				return Promise.reject(rtn);
			}
			return download;
		}
	},
	xdcc:function(param)
	{
		if(param.method!="POST"||!param.data.network||!param.data.user)
		{
			return Promise.reject('POST Json like:{network:"myNetwork",user:"myUser"}');
		}
		else
		{
			return xdccManager.request(param.data);
		}
	}
}

config.ready.then(function(config)
{
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
					return ircManager.connect(name,credentials.nickname,credentials.password);
				})
				.catch(function(e)
				{
					µ.logger.error(e);
				});
			}
		}
	}
});