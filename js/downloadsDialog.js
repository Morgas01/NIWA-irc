(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		dlg:"gui.Dialog",
		DownloadTable:"NIWA-Download.DownloadTable"
	});

	let dialog=null;

	let downloadsDialog=function()
	{
		if(dialog==null)
		{
			dialog=new SC.dlg(function(container)
			{
				let closeBtn=document.createElement("button");
				closeBtn.textContent="\u274C";
				closeBtn.dataset.action="close";
				container.appendChild(closeBtn);

				let table=new SC.DownloadTable([
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
			dialog.content.classList.add("downloadsDialog");
		}
		else dialog.appendTo(document.body);
	};

	SMOD("downloadsDialog",downloadsDialog);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);