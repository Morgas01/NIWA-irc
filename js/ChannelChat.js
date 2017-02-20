(function(µ,SMOD,GMOD,HMOD,SC){

	var Chat=GMOD("Chat");

	//SC=SC({});

	var ChannelChat=µ.Class(Chat,
	{
		init:function()
		{
			this.mega();
			this.container.classList.add("Channel");
			this.topic=document.createElement("div");
			this.userList=document.createElement("div");
			this.container.insertBefore(this.topic,this.container.firstElementChild);
			this.container.appendChild(this.userList);
		},
		setTopic:function(topic)
		{
			while(this.topic.firstElementChild)this.topic.firstElementChild.remove();
			this.topic.appendChild(this.parseMessageText(topic));
		},
		setUserList:function(userList)
		{
		}
	});

	SMOD("ChannelChat",ChannelChat);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);