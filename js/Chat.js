(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		Download:"NIWA-Download.Download"
	});

	let formatTime=function(time)
	{
		let date=new Date()
		date.setTime(time);
		return ("0"+date.getHours()).slice(-2)+":"+
		("0"+date.getMinutes()).slice(-2)+":"+
		("0"+date.getSeconds()).slice(-2);
	};
	let ircColorRegExp=/((?:[\x02\x1D\x1F\x16\x0F]|\x03(?:\d{0,2}(?:,\d{1,2})?)?)*)([^\x02\x03\x1D\x1F\x16\x0F]+)/g;
	let linkRegExp=/https?:\/\/\S+/g;

	let Chat=µ.Class({
		constructor:function(param)
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
				for(let m of param.messages) this.addMessage(m);
			}
		},
		addMessage:function(message)
		{
			let row=document.createElement("tr");
			let timestamp=document.createElement("td");
			timestamp.classList.add("timestamp");
			let username=document.createElement("td");
			username.classList.add("username");
			let text=document.createElement("td");
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
				let rtn=document.createElement("span");
				let desc=document.createElement("span");
				rtn.appendChild(desc);
				let accept=document.createElement("button");
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
			let text=this.parseMessageColors(message.text);
			text=this.parseLinks(text);
			return text;
		},
		parseMessageColors:function(textOrFragmentOfElements)
		{
			let color="";
			let bColor="";
			let bold=false;
			let italics=false;
			let underline=false;
			let reverse=false;
			return Chat.parseText(textOrFragmentOfElements,ircColorRegExp,function(match,codes,textPart)
			{
				let span=document.createElement("span");
				for(let i=0;i<codes.length;i++)
				{
					switch(codes[i])
					{
						case "\x03":
							let match=codes.match(/.*\x03(\d{1,2})?(?:,(\d{1,2}))?/);
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
				let a=document.createElement("a");
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
				let match=this.input.value.match(/^\/(\S+)\s*(.*)$/);
				let detail={
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
	let replaceText=function(text,regExp,replacer)
	{
		let rtn=[];
		let offset=0;
		text.replace(regExp,function(match)
		{
			let nextOffset=arguments[arguments.length-2];
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
			let fragment=document.createDocumentFragment();
			let parsedChildren=replaceText(textOrFragmentOfElements,regExp,replacer);
			if(parsedChildren.length>0)
			{
				for(let parsedChild of parsedChildren) fragment.appendChild(parsedChild);
			}
			else
			{
				fragment.appendChild(document.createTextNode(textOrFragmentOfElements));
			}
			return fragment;
		}
		else for(let e of textOrFragmentOfElements.children)
		{
			if(regExp.test(e.textContent))
			{
				let parsedChildren=replaceText(e.textContent,regExp,replacer)
				if(parsedChildren.length>0)
				{
					while(e.firstChild) e.firstChild.remove();
					for(let parsedChild of parsedChildren) e.appendChild(parsedChild);
				}
			}
		}
		return textOrFragmentOfElements;
	};
	SMOD("Chat",Chat);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);