
var config=require("./config");

var messages=[];
var addMessage=function(network,sender,receiver,message,type)
{
	var msg={
		network:network,
		sender:sender,
		receiver:receiver,
		message:message,
		type:type
	};
	messages.push(msg);
	worker.event("irc",messages,"message",msg);
};

var getNickname=function(network,nickname)
{
	return config.ready
	.then(c=>c.get("networks"))
	.then(function(networks)
	{
		var n=networks.get(network);
		if(!n)
		{
			n=networks.add(network);
		}
		if(nickname)
		{
			n.set("nickname",nickname);
			config.save();
		}
		nickname=n.get("nickname").get();
		if(!nickname) nickname=Promise.reject("no nickname");
		return nickname;
	});
}

module.exports={
	connect:function(param)
	{
		if(param.method!="POST"||!param.data.host)
		{
			return Promise.reject('POST Json like:{host:"myHost"[,nickname:"myNick"[,password:"myPassword"]}');
		}
		else {
			return getNickname(param.data.host,param.data.nickname)
			.then(function(nickname)
			{
				addMessage(param.data.host,"server",nickname,`trying to connect to ${param.data.host} as ${nickname} with${param.data.password?'':'out'} password`);
			});
		}
	}
}