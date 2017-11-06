(function(µ,SMOD,GMOD,HMOD,SC){

	//fun
	µ.logger.info(GMOD("signature"));

	let tabs=GMOD("gui.tabs");
	let actionize=GMOD("gui.actionize");
	let getInputValues=GMOD("getInputValues");

	SC=SC({
		rq:"request",
		NetworkTab:"NetworkTab",
		help:"help",
		configDialog:"configDialog",
		downloadsDialog:"downloadsDialog"
	});

	let networkMap=new WeakMap();
	let networkTabs=tabs();
	networkTabs.classList.add("networks");
	document.body.appendChild(networkTabs);

	networkTabs.addTab("➕",function(container)
	{
		container.classList.add("newTab");
		container.innerHTML=String.raw
`
<table>
	<tr><td>Host</td><td><input type="text" name="host"></td></tr>
	<tr><td>Nickname</td><td><input type="text" name="nickname"></td></tr>
	<tr><td colspan="2"><button data-action="connect">connect</button></td></tr>
	<tr><td colspan="2" id="connectErrors"></td></tr>
</table>
`		;
		actionize({
			connect:function()
			{
				let data=getInputValues(container.querySelectorAll("input"));
				SC.rq({
					url:"rest/irc/connect",
					data:JSON.stringify(data)
				}).then(function()
				{
					getNetwork(data.host,true);
					container.querySelector("#connectErrors").textContent="";
				},
				function(e)
				{
					µ.logger.error(e);
					if(e.xhr.responseText)
					{
						container.querySelector("#connectErrors").textContent=e.xhr.responseText;
					}
				});
			}
		},container);
	},true);

	let getNetwork=function(name,activate,networkData)
	{
		let tab=networkTabs.getTabsByTitleContent(name)[0];
		if(!tab)
		{
			let network=new SC.NetworkTab(networkData);
			networkTabs.addTab(name,network.tabs,activate==true,-1);
			networkMap.set(network.tabs,network);
			return network;
		}
		else if(activate) networkTabs.setActive(tab);
		return networkMap.get(tab);
	}
	let addMessage=function(message)
	{
		let network=getNetwork(message.server);
		network.addMessage(message);
	}


	let es=new EventSource("event/irc");
	window.addEventListener("beforeunload",function(){es.close()})
	es.addEventListener("error",function(error)
	{
		µ.logger.info("error",event);
		if(es.readyState==EventSource.CLOSED) alert("connection lost");
		µ.logger.error(error);
	});
	es.addEventListener("ping",µ.logger.debug);
	es.addEventListener("init",function(event)
	{
		µ.logger.info("init",event);
		while(networkTabs.length>1) networkTabs.removeTab(0);
		let data=JSON.parse(event.data);
		let networks=[];
		for(let networkName in data)
		{
			getNetwork(networkName,false,data[networkName]);
		}
		networkTabs.setActive(0);
	});
	es.addEventListener("message",function(event)
	{
		µ.logger.info("message",event);
		addMessage(JSON.parse(event.data));
	});
	es.addEventListener("userList",function(event)
	{
		µ.logger.info("userList",event);
		let data=JSON.parse(event.data);
		let network=getNetwork(data.server);
		network.setUserList(data.channel,data.userList);

	});
	es.addEventListener("topic",function(event)
	{
		µ.logger.info("topic",event);
		let data=JSON.parse(event.data);
		let network=getNetwork(data.server);
		network.setTopic(data.channel,data.topic);

	});


	let globalActions={
		downloads:()=>SC.downloadsDialog(),
		jump:function(){},
		config:()=>SC.configDialog(),
		help:()=>SC.help(),
	};

	actionize(globalActions,document.getElementById("globalActions"));

	networkTabs.addEventListener("chatCommand",function(event)
	{
		let activeNetwork=networkTabs.getActive();
		let chats=networkTabs.getTab(activeNetwork);

		let command=event.detail.command.toLowerCase();

		let target=chats.getActive().textContent;
		let value=event.detail.value;
		let data={
			network:activeNetwork.textContent
		};
		let match;
		switch(command)
		{
			case "help":
				requestAnimationFrame( // decouple keydown event for autofocus in help dialog
					actions.help
				);
				return;
			case "msg":
				match=value.match(/^(\S+)\s+(.+)/);
				if(!match)
				{
					//TODO error message
					return;
				}
				else
				{
					command="message";
					data.target=match[1];
					data.text=match[2];
				}
				break;
			case "say":
				command="message";
				data.target=target;
				data.text=value;
				break;
			case "join":
				data.channel=value;
				break;
			case "whois":
				data.user=value;
				break;
			case "xdcc":
				match=value.match(/^(?:([^#\d]\S*)\s+)?#?(\d+)/);
				if(!match)
				{
					//TODO error message
					return;
				}
				else
				{
					data.user=match[1]||target;
					data.packnumber=match[2];
					break;
				}
				break;
			default:
				//TODO
				µ.logger.warn(`unknown command: ${command}`);
				return;
		}

		SC.rq({
			url:"rest/irc/"+command,
			data:JSON.stringify(data)
		})
		.catch(µ.logger.error);
	});

	actionize({
		dccSend:function(event,button)
		{
			let activeNetwork=networkTabs.getActive();
			let chats=networkTabs.getTab(activeNetwork);
			let user=chats.getActive().textContent;

			SC.rq({
				url:"rest/irc/dcc",
				data:JSON.stringify({
					network:activeNetwork.textContent,
					user:user,
					ip:button.dataset.ip,
					port:button.dataset.port,
					filename:button.dataset.filename
				})
			})
			.catch(µ.logger.error);
		}
	},networkTabs);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);