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
		<tr><td>/msg &lt;nick|channel&gt; &lt;message&gt;</td><td>Sends message to specific user or channel in the current network</td></tr>
		<tr><td>/whois &lt;nick&gt;</td><td>Shows information about the user</td></tr>
		<tr><td>/join &lt;channel&gt;</td><td>Joins channel in the current network</td></tr>
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