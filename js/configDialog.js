(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		dlg:"gui.dialog",
		form:"gui.form",
		rq:"request"
	});

	var configDialog=null;
	var configwrapper=document.createElement("div");
	var form=null;

	configwrapper.addEventListener("formChange",function(event)
	{
		SC.rq({
			url:"rest/config",
			data:JSON.stringify({
				key:event.detail.path.concat(event.detail.key),
				value:event.detail.value
			})
		});
	})

	SMOD("configDialog",function showConfigDialog()
	{
		if(configDialog==null)
		{
			configDialog=SC.dlg(function(element)
			{
				element.appendChild(configwrapper);
				var closeBtn=document.createElement("button");
				closeBtn.dataset.action=closeBtn.textContent="close";
				closeBtn.autofocus=true;
				element.appendChild(closeBtn);
			},
			{
				modal:true
			});
		}
		else configDialog.appendTo(document.body);
		if(form) form.remove();
		SC.rq.json({
			method:"OPTIONS",
			url:"rest/config"
		}).then(function(data)
		{
			form=SC.form(data.description,data.value);
			configwrapper.appendChild(form);
		});
	})

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);