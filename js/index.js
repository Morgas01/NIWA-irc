(function(µ,SMOD,GMOD,HMOD,SC){

	var tabs=GMOD("gui.tabs");
	var actionize=GMOD("gui.actionize");
	var getInputValues=GMOD("getInputValues");

	SC=SC({
		rq:"request"
	});

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
					document.getElementById("connectErrors").textContent="";
				},
				function(e)
				{
					µ.logger.error(e);
					if(e.xhr.responseText)
					{
						document.getElementById("connectErrors").textContent=e.xhr.responseText;
					}
				});
			}
		},container);
	});

	networkTabs.setActive(0);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);