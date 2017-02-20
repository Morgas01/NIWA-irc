(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		tabs:"gui.tabs",
		Chat:"Chat",
		ChannelChat:"ChannelChat",
		messageUtils:"messageUtils"
	});

	var NetworkTab=µ.Class({
		init:function(networkName)
		{
			this.tabs=SC.tabs();
			this.tabs.classList.add("network");
			this.chatMap=new WeakMap();
			this.addChat(SC.messageUtils.SERVER,new SC.Chat(),true);
		},
		addChat:function(name,chat,activate)
		{
			this.tabs.addTab(name,chat.container,activate);
			this.chatMap.set(chat.container,chat);
			return chat;
		},
		getChat:function(name)
		{
			var tab=this.tabs.getTabsByTitleContent(name)[0];
			if(!tab)
			{
				if(SC.messageUtils.targetIsChannel(name)) return this.addChat(name,new SC.ChannelChat());
				else return this.addChat(name,new SC.Chat());
			}
			return this.chatMap.get(tab);
		},
		addMessage:function(message)
		{
			var target=SC.messageUtils.getTarget(message);
			var chat=this.getChat(target);
			return chat.addMessage(message);
		},
		setTopic:function(channelName,topic)
		{
			var chat=this.getChat(channelName);
			chat.setTopic(topic);
		},
		setUserList:function(channelName,userList)
		{
			var chat=this.getChat(channelName);
			chat.setUserList(userList);
		}
	});

	SMOD("NetworkTab",NetworkTab);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);