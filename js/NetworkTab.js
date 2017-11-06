(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		tabs:"gui.tabs",
		Chat:"Chat",
		ChannelChat:"ChannelChat",
		messageUtils:"messageUtils"
	});

	let NetworkTab=µ.Class({
		constructor:function(networkData)
		{
			this.tabs=SC.tabs();
			this.tabs.classList.add("network");
			this.chatMap=new WeakMap();
			this.addChat(SC.messageUtils.SERVER,new SC.Chat(networkData),true);
			if (networkData)
			{
				for(let targetName in networkData.targets)
				{
					this.getChat(targetName,networkData.targets[targetName]);
				}
			}
		},
		addChat:function(name,chat,activate)
		{
			this.tabs.addTab(name,chat.container,activate);
			this.chatMap.set(chat.container,chat);
			return chat;
		},
		getChat:function(name,chatData)
		{
			let tab=this.tabs.getTabsByTitleContent(name||SC.messageUtils.SERVER)[0];
			if(!tab)
			{
				if(SC.messageUtils.isChannel(name)) return this.addChat(name,new SC.ChannelChat(chatData));
				else return this.addChat(name,new SC.Chat(chatData));
			}
			return this.chatMap.get(tab);
		},
		addMessage:function(message)
		{
			let chat=this.getChat(message.target);
			return chat.addMessage(message);
		},
		setTopic:function(channelName,topic)
		{
			let chat=this.getChat(channelName);
			chat.setTopic(topic);
		},
		setUserList:function(channelName,userList)
		{
			let chat=this.getChat(channelName);
			chat.setUserList(userList);
		}
	});

	SMOD("NetworkTab",NetworkTab);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);