(function(µ,SMOD,GMOD,HMOD,SC){

	let Chat=GMOD("Chat");

	//SC=SC({});

	let insertHelper=document.createDocumentFragment();

	let ChannelChat=µ.Class(Chat,
	{
		constructor:function(param)
		{
			this.mega(param);
			this.container.classList.add("Channel");
			this.topic=document.createElement("div");
			this.topic.classList.add("topic");
			this.userList=document.createElement("div");
			this.userList.classList.add("userList");

			this.container.insertBefore(this.topic,this.container.firstElementChild);
			let wrapper=document.createElement("div");
			wrapper.classList.add("wrapper");
			this.container.insertBefore(wrapper,this.input);
			wrapper.appendChild(this.scrollContainer);
			wrapper.appendChild(this.userList);

			if (param)
			{
				if(param.topic) this.setTopic(param.topic);
				if(param.userList) this.setUserList(param.userList);
			}
		},
		setTopic:function(topic)
		{
			while(this.topic.firstElementChild)this.topic.firstElementChild.remove();
			this.topic.appendChild(
				this.parseLinks(
					this.parseMessageColors(topic)
				)
			);
		},
		setUserList:function(userList)
		{
			while(this.userList.firstChild)this.userList.firstChild.remove();
			userList=Object.keys(userList);
			userList.sort();
			for(let user of userList)
			{
				let div=document.createElement("div");
				div.textContent=user;
				insertHelper.appendChild(div);
			}
			this.userList.appendChild(insertHelper);
		}
	});

	SMOD("ChannelChat",ChannelChat);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);