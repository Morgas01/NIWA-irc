(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		irc:require.bind(null,"irc"),
		messageUtils:require.bind(null,"../js/messageUtils"),
		prom:"Promise"
	});

	var clients=new Map();

	var CONNECTION_TIMEOUT=30000;
	var TYPES={
		ERROR:"ERROR",
		RAW:"RAW",
		MESSAGE:"MESSAGE"
	};

	var manager=module.exports={
		data:{},
		getClient:function(network,user,password)
		{
			if(!clients.has(network))
			{
				clients.set(network,new Promise(function(resolve,reject)
				{
					var newClient= new SC.irc.Client(network,user,{password:password});
					newClient.on('registered', function() {
						resolve(newClient);
					});
					setTimeout(function()
					{
						clients.delete(network);
						newClient.removeAllListeners();
						newClient.on('registered', function() {
							newClient.disconnect();
						});
						reject("timeout");
					},CONNECTION_TIMEOUT);

					registerEvents(network,newClient);

				}));
			}
			return clients.get(network);
		}
	};

	var registerEvents=function(network,newClient)
	{
		newClient.on('error', function(msg) {
			addMessage(newClient,null,null,message,TYPES.ERROR)
		});
		newClient.on('raw', function(message) {
			addMessage(newClient,message.nick,null,JSON.stringify(message,null,"\t"),TYPES.RAW)
		});
		/*
		newClient.on('', function() {

		});
		newClient.on('', function() {

		});
		newClient.on('', function() {

		});
		*/
	};
	var addMessage=function(client,sender,receiver,text,type)
    {
    	var target=client.nick==receiver?sender:receiver;

    	var msg={
    		user:sender,
    		text:text,
    		type:type,
    		time:Date.now()
    	};

    	if(!(client.opt.server in manager.data))manager.data[client.opt.server]={};
    	var data=manager.data[client.opt.server];

		var
    	if(!target)
    	{
    		if(!data.messages) data.messages=[];
    		data.messages.push(msg);
    	}
    	else
    	{
    		if(!data.targets) data.targets={};
    		if(!data.targets[target]) data.targets[target]=[];
    		data.targets[target].push(msg);
    	}

    	worker.event("irc",manager.data,"message",{
    		server:client.opt.server,
    		target:target,
    		user:sender,
    		text:text,
    		type:type,
    		time:msg.time
    	});
    };

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);