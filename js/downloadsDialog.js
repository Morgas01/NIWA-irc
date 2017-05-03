(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		dlg:"gui.dialog",
		downloadTable:"downloadTable"
	});

	var dialog=null;

	var downloadsDialog=function()
	{
		if(dialog==null)
		{
			dialog=SC.dlg(function(container)
			{
				var closeBtn=document.createElement("button");
				closeBtn.textContent="\u274C";
				closeBtn.dataset.action="close";
				container.appendChild(closeBtn);

				var table=SC.downloadTable([
					"filepath",
					"messages",
					"filesize",
					"progress",
					"speed",
					"time",
					function source(cell,data)
					{
						cell.textContent=data.dataSource.user+"@"+data.dataSource.network;
					}
				]);
				container.appendChild(table.getContainer());

			},{modal:true});
			dialog.classList.add("downloadsDialog");
		}
		else dialog.appendTo(document.body);
	};

	SMOD("downloadsDialog",downloadsDialog);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);