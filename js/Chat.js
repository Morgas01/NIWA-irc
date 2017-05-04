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
	};
	var textFormatExp=/((?:[\x02\x03](?:\d{0,2}(?:,\d{1,2})?)?)*)([^\x02\x03]+)/g;

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
			username.appendChild(this.parseMessageColors(message.user));
			username.title=this.stripColors(message.user);
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
			var rtn=document.createDocumentFragment();
			if(!text) return rtn;

			var color="";
			var bColor="";
			var bold=false;
			var italics=false;
			var underline=false;

			text.replace(textFormatExp,function(match,codes,textPart)
			{
				var span=document.createElement("span");
				rtn.appendChild(span);

				var match=codes.match(/.*\x03(\d{1,2})(?:,(\d{1,2}))?/);
				if(match)
				{
					color=("0"+match[1]).slice(-2);
					if(match[2]) bColor=("0"+match[2]).slice(-2);
				}
				match=codes.match(/\x02/g);
				if(match&&match.length%2!=0) bold=!bold;
				match=codes.match(/\x1D/g);
				if(match&&match.length%2!=0) italics=!italics;
				match=codes.match(/\x1F/g);
				if(match&&match.length%2!=0) underline=!underline;

				span.dataset.color=color;
				span.dataset.bColor=bColor;
				span.dataset.bold=bold;
				span.dataset.italics=italics;
				span.dataset.underline=underline;

				span.textContent=textPart;
			});
			return rtn;
		},
		stripColors:function(text)
		{
			return text&&text.replace(textFormatExp,"$2")||"";
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