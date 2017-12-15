(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		dlg:"gui.Dialog"
	});

	let helpDialog=null;

	SMOD("help",function showHelp()
	{
		if(helpDialog==null)
		{
			helpDialog=new SC.dlg(String.raw
`
<table>
	<thead>
		<tr><th>Command</th><th>Usage</th></tr>
	</thead>
	<tbody>
		<tr><td>/help</td><td>Opens this dialog</td></tr>
		<tr><td>/msg &lt;nick|channel&gt; &lt;message&gt;</td><td>Sends message to specific user or channel</td></tr>
		<tr><td>/say &lt;message&gt;</td><td>Sends message to user or channel (usful when message begins with &#x2F)</td></tr>
		<tr><td>/whois &lt;nick&gt;</td><td>Shows information about the user</td></tr>
		<tr><td>/join &lt;channel&gt;</td><td>Joins channel</td></tr>
		<tr><td>/xdcc &lt;nick&gt; &lt;#&gt;packnumber</td><td>send a XDCC request to the user</td></tr>
		<tr><td></td><td></td></tr>
	</tbody>
</table>
<button data-action="close" autofocus>OK</button>
`
			,{
				modal:true,
			});
		}
		else helpDialog.appendTo(document.body);
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);