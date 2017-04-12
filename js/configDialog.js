(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		dlg:"gui.dialog",
		form:"gui.form",
		rq:"request"
	});

	var configDialog=null;
	var configwrapper=document.createElement("div");
	configwrapper.classList.add("config")
	var form=null;

	configwrapper.addEventListener("formChange",function(event)
	{
		var field=event.target;
		field.disabled=true;
		SC.rq.json({
			url:"rest/config",
			data:JSON.stringify({
				path:event.detail.path.concat(event.detail.key),
				value:event.detail.value
			})
		})
		.then(function(reply)
		{
			if(!reply.result)
			{
				field.setCustomValidity(reply.error);
			}
		})
		.always(()=>
		event.target.disabled=false);
	});
	configwrapper.addEventListener("formAdd",function(event)
	{
		SC.rq({
			url:"rest/config",
			method:"PUT",
			data:JSON.stringify({
				path:event.detail.path,
				key:event.detail.key,
				value:event.detail.value,
				field:event.detail.field.toDescription()
			})
		});
	});
	configwrapper.addEventListener("formRemove",function(event)
	{
		SC.rq({
			url:"rest/config",
			method:"DELETE",
			data:JSON.stringify({
				path:event.detail.path,
				key:event.detail.key,
			})
		});
	});

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


			/**** additions ****/

			var globalNick=form.querySelector("[name=nickname][data-path='']");
			for (var nick of form.querySelectorAll("[name=nickname][data-path*='.']"))
			{
				nick.placeholder=globalNick.value
			}

			var globalDccFolder=form.querySelector("[name='DCC folder'][data-path='']");
			for (var dccFolder of form.querySelectorAll("[name='DCC folder'][data-path*='.']"))
			{
				dccFolder.placeholder=globalDccFolder.value
			}

			configwrapper.appendChild(form);
		});
	})

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);