
var config=require("./config");

var messageUtils=require("../js/messageUtils");

var ircData={
	messages:[],
	networks:{}
};
var addMessage=function(network,sender,receiver,text,type)
{
	var msg={
		network:network,
		sender:sender,
		receiver:receiver,
		text:text,
		type:type,
		time:Date.now()
	};
	ircData.messages.push(msg);
	worker.event("irc",ircData,"message",msg);
};
var getChannel=function(network,channel)
{
	if(!(network in ircData.networks)) ircData.networks[network]={channels:{}};
	network=ircData.networks[network];
	if(!(channel in network.channels)) network.channels[channel]={topic:null,userList:null};
	return network.channels[channel];
}
var setTopic=function(network,channel,topic)
{
	c=getChannel(network,channel);
	c.topic=topic;

	worker.event("irc",ircData,"topic",{network:network,channel:channel,topic:topic});
};
var setUserList=function(network,channel,userList)
{
	c=getChannel(network,channel);
	c.userList=userList;

	worker.event("irc",ircData,"userList",{network:network,channel:channel,userList:userList});
};

worker.event("irc",ircData,"init",null);

var getCredentials=function(network,nickname,password)
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
			n.set("password",password||null);
			config.save();
		}
		nickname=n.get("nickname").get();
		if(!nickname) nickname=Promise.reject("no credentials");
		return {nickname:nickname,password:n.get("password").get()};
	});
};

module.exports={
	connect:function(param)
	{
		if(param.method!="POST"||!param.data.host)
		{
			return Promise.reject('POST Json like:{host:"myHost"[,nickname:"myNick"[,password:"myPassword"]}');
		}
		else {
			return getCredentials(param.data.host,param.data.nickname,param.data.password)
			.then(function(credentials)
			{
				addMessage(param.data.host,messageUtils.SERVER,messageUtils.maskUserName(credentials.nickname),`trying to connect to ${param.data.host} as ${credentials.nickname} with${credentials.password?'':'out'} password`);

				//test
				addMessage(param.data.host,"testUser","#testChannel","test Message");
				setTopic(param.data.host,"#testChannel","test topic");
				setUserList(param.data.host,"#testChannel",["test","list"]);
				addMessage(param.data.host,"testUser",messageUtils.maskUserName(credentials.nickname),"private message");
				addMessage(param.data.host,credentials.nickname,"testUser","private answer");
			});
		}
	},
	message:function()
	{
	},
	join:function()
	{
	},
	whois:function()
	{
	}
}