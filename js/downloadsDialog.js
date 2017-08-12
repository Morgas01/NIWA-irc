(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		dlg:"gui.dialog",
		DownloadTable:"NIWA-Download.DownloadTable"
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

				var table=new SC.DownloadTable([
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
				container.appendChild(table.element);

			},{modal:true});
			dialog.classList.add("downloadsDialog");
		}
		else dialog.appendTo(document.body);
	};

	SMOD("downloadsDialog",downloadsDialog);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);