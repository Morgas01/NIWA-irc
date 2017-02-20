(function(µ,SMOD,GMOD,HMOD,SC){

	var tabs=GMOD("gui.tabs");
	var actionize=GMOD("gui.actionize");
	var getInputValues=GMOD("getInputValues");

	SC=SC({
		rq:"request",
		NetworkTab:"NetworkTab"
	});

	var networkMap=new WeakMap();
	var networkTabs=tabs();
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
				var data=getInputValues(container.querySelectorAll("input"));
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
	});

	var getNetwork=function(name,activate)
	{
		var tab=networkTabs.getTabsByTitleContent(name)[0];
		if(!tab)
		{
			var network=new SC.NetworkTab();
			networkTabs.addTab(name,network.tabs,activate==true,-1);
			networkMap.set(network.tabs,network);
			return network;
		}
		else if(activate) networkTabs.setActive(tab);
		return networkMap.get(tab);
	}
	var addMessage=function(message)
	{
		var network=getNetwork(message.network);
		network.addMessage(message);
	}

	var es=new EventSource("event/irc");
	window.addEventListener("beforeunload",function(){es.close()})
	es.addEventListener("error",function(error)
	{
		if(es.readyState==EventSource.CLOSED) alert("connection lost");
		µ.logger.error(error);
	});
	es.addEventListener("ping",µ.logger.debug);
	es.addEventListener("init",function(event)
	{
		var data=JSON.parse(event.data);
		for(var network in data.networks)
		{
			var channels=data.networks[network].channels;
			var network=getNetwork(network);
			for(var channelName in channels)
			{
				var channel=channels[channelName];
				if(channel.topic) network.setTopic(channelName,channel.topic);
				if(channel.userList) network.setUserList(channelName,channel.userList);
			}
		}
		for(var message of data.messages) addMessage(message);

		networkTabs.setActive(0);
	});
	es.addEventListener("message",function(event)
	{
		addMessage(JSON.parse(event.data));
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);