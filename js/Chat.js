(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		Download:"Download"
	});

	var formatTime=function(time)
	{
		var date=new Date()
		date.setTime(time);
		return ("0"+date.getHours()).slice(-2)+":"+
		("0"+date.getMinutes()).slice(-2)+":"+
		("0"+date.getSeconds()).slice(-2);
	}

	var Chat=µ.Class({
		init:function(param)
		{
			this.container=document.createElement("div");
			this.container.classList.add("Chat");
			this.scrollContainer=document.createElement("div");
			this.scrollContainer.classList.add("scrollContainer");
			this.container.appendChild(this.scrollContainer);

			this.messageTable=document.createElement("table");
			this.messageTableBody=document.createElement("tbody");
			this.messageTable.appendChild(this.messageTableBody);

			this.scrollContainer.appendChild(this.messageTable);

			this.input=document.createElement("input");
			this.input.type="text";
			this.container.appendChild(this.input);
			this.container.addEventListener("keydown",e=>this.onKeyDown(e))

			if (param)
			{
				for(var m of param.messages) this.addMessage(m);
			}
		},
		addMessage:function(message)
		{
			var row=document.createElement("tr");
			var timestamp=document.createElement("td");
			timestamp.classList.add("timestamp");
			var username=document.createElement("td");
			username.classList.add("username");
			var text=document.createElement("td");
			text.classList.add("text");

			row.dataset.type=message.type;
			timestamp.textContent=formatTime(message.time);
			username.textContent=message.user;
			text.appendChild(this.parseMessage(message));

			row.appendChild(timestamp);
			row.appendChild(username);
			row.appendChild(text);
			this.messageTableBody.appendChild(row);
		},
		parseMessage:function(message)
		{
			//TODO
			if(message.dcc)
			{
				var rtn=document.createElement("span");
				var desc=document.createElement("span");
				rtn.appendChild(desc);
				var accept=document.createElement("button");
				accept.textContent="accept";
				rtn.appendChild(accept);

				if (message.dcc.command==="SEND")
				{
					desc.textContent=`Offers you the file "${message.dcc.filename}" (${SC.Download.formatFilesize(message.dcc.filesize)})`;
					accept.dataset.action="dccSend";
					accept.dataset.ip=message.dcc.ip;
					accept.dataset.port=message.dcc.port;
					accept.dataset.filename=message.dcc.filename;
				}
				else return this.parseMessageColors(message.text);
				return rtn;
			}
			return this.parseMessageColors(message.text);
		},
		parseMessageColors:function(text)
		{
			var rtn=document.createElement("span");
			// TODO irc colors
			rtn.textContent=text;
			return rtn;
		},
		onKeyDown:function(event)
		{
			if(event.key=='Enter')
			{
				//TODO
				var match=this.input.value.match(/^\/(\S+)\s*(.*)$/);
				var detail={
					command:"say",
					value:null
				};
				if(match)
				{
					detail.command=match[1];
					detail.value=match[2];
				}
				else detail.value=this.input.value;

				this.input.dispatchEvent(new CustomEvent("chatCommand",{
					bubbles:true,
					detail:detail
				}));

				this.input.value="";
			}
		}
	});
	SMOD("Chat",Chat);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);