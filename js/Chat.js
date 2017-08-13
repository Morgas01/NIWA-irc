(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		Download:"NIWA-Download.Download"
	});

	var formatTime=function(time)
	{
		var date=new Date()
		date.setTime(time);
		return ("0"+date.getHours()).slice(-2)+":"+
		("0"+date.getMinutes()).slice(-2)+":"+
		("0"+date.getSeconds()).slice(-2);
	};
	var ircColorRegExp=/((?:[\x02\x1D\x1F\x16\x0F]|\x03(?:\d{0,2}(?:,\d{1,2})?)?)*)([^\x02\x03\x1D\x1F\x16\x0F]+)/g;
	var linkRegExp=/https?:\/\/\S+/g;

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
			if(message.user) username.appendChild(this.parseMessageColors(message.user));
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
					desc.textContent=`Offers you the file "${message.dcc.filename}" (${SC.Download.formatFilesize(message.dcc.filesize)}) `;
					accept.dataset.action="dccSend";
					accept.dataset.ip=message.dcc.ip;
					accept.dataset.port=message.dcc.port;
					accept.dataset.filename=message.dcc.filename;
				}
				else return this.parseMessageColors(message.text);
				return rtn;
			}
			var text=this.parseMessageColors(message.text);
			text=this.parseLinks(text);
			return text;
		},
		parseMessageColors:function(textOrFragmentOfElements)
		{
			var color="";
			var bColor="";
			var bold=false;
			var italics=false;
			var underline=false;
			var reverse=false;
			return Chat.parseText(textOrFragmentOfElements,ircColorRegExp,function(match,codes,textPart)
			{
				var span=document.createElement("span");
				for(var i=0;i<codes.length;i++)
				{
					switch(codes[i])
					{
						case "\x03":
							var match=codes.match(/.*\x03(\d{1,2})?(?:,(\d{1,2}))?/);
							if(match[1]) color=("0"+match[1]).slice(-2);
							else color=""
							if(match[2]) bColor=("0"+match[2]).slice(-2);
							else if (!match[1])
							{
								bColor="";
							}
							i+=match[0].length-1;
							break;
						case "\x02":
							bold=!bold;
							break
						case "\x1D":
							italics=!italics;
							break;
						case "\x1F":
							underline=!underline;
							break;
						case "\x16":
							reverse=!reverse;
							break;
						case "\x0F":
							color="";
							bColor="";
							bold=false;
							italics=false;
							underline=false;
							reverse=false;
							break;
					}
				}
				span.dataset.color=color;
				span.dataset.bColor=bColor;
				span.dataset.bold=bold;
				span.dataset.italics=italics;
				span.dataset.underline=underline;
				span.dataset.reverse=reverse;

				span.textContent=textPart;
				return span;
			})
		},
		stripColors:function(text)
		{
			return text&&text.replace(ircColorRegExp,"$2")||"";
		},
		parseLinks:function(textOrFragmentOfElements)
		{
			return Chat.parseText(textOrFragmentOfElements,linkRegExp,function(url)
			{
				var a=document.createElement("a");
				a.classList.add("messageLink")
				a.target="_blank";
				a.href=url;
				a.textContent=url;
				return a;
			});
		},
		onKeyDown:function(event)
		{
			if(event.key=='Enter')
			{
				//TODO history
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
	var replaceText=function(text,regExp,replacer)
	{
		var rtn=[];
		var offset=0;
		text.replace(regExp,function(match)
		{
			var nextOffset=arguments[arguments.length-2];
			if(nextOffset>offset)
			{
				rtn.push(document.createTextNode(text.slice(offset,nextOffset)));
			}
			rtn.push(replacer.apply(null,arguments));
			offset=nextOffset+match.length;
		});
		if(offset!=0&&offset<text.length)
		{
			rtn.push(document.createTextNode(text.slice(offset)));
		}
		return rtn;
	};
	Chat.parseText=function(textOrFragmentOfElements,regExp,replacer)
	{

		if(typeof textOrFragmentOfElements == "string")
		{
			var fragment=document.createDocumentFragment();
			var parsedChildren=replaceText(textOrFragmentOfElements,regExp,replacer);
			if(parsedChildren.length>0)
			{
				for(var parsedChild of parsedChildren) fragment.appendChild(parsedChild);
			}
			else
			{
				fragment.appendChild(document.createTextNode(textOrFragmentOfElements));
			}
			return fragment;
		}
		else for(var e of textOrFragmentOfElements.children)
		{
			if(regExp.test(e.textContent))
			{
				var parsedChildren=replaceText(e.textContent,regExp,replacer)
				if(parsedChildren.length>0)
				{
					while(e.firstChild) e.firstChild.remove();
					for(var parsedChild of parsedChildren) e.appendChild(parsedChild);
				}
			}
		}
		return textOrFragmentOfElements;
	};
	SMOD("Chat",Chat);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);