(function(µ,SMOD,GMOD,HMOD,SC){

	//SC=SC({})
	var utils={
		SERVER:"<Server>",
		ME:"<Me>",
		getTarget:function(message)
		{
			if(message.receiver.indexOf(utils.ME)==0) return message.sender;
			return message.receiver;
		},
		getDisplayName:function(message)
		{
			if(message.sender.indexOf(utils.ME)==0) return message.sender.slice(utils.ME.length);
			return message.sender;
		},
		targetIsChannel:function(target)
		{
			return /^#|$/.test(target);
		},
		isChannelTarget:function(message)
		{
			return utils.targetIsChannel(utils.getTarget(message))
		},
		maskUserName:function(userName)
		{
			return utils.ME+userName;
		}
	};

	SMOD("messageUtils",utils);

	if(typeof module !== "undefined") module.exports=utils;

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);