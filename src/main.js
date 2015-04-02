//@program
var THEME = require('themes/sample/theme');
var BUTTONS = require("controls/buttons");
var DIALOG = require('mobile/dialog');
var MODEL = require('mobile/model');
var chart = require("charts4kpr.js");

var CHART = new chart.chart(300, 140);
var graph;
var info = new Object();
var demoData = [5,10,20]
var cameraDisabled = false;
deviceURL = "";
var whiteSkin = new Skin( { fill:"black" } );
var cameraSkin = new Skin({width: 48,
						   height: 48,
						   texture: new Texture('camera.png')
						   });
var cameraDisabledSkin = new Skin({width: 48,
						   height: 48,
						   texture: new Texture('camera-disabled.png')
						   });
var cameraLoadingSkin = new Skin({width: 48,
						   height: 48,
						   texture: new Texture('camera-loading.png')
						   });
						   
var rabbitSkin = new Skin({width: 128,
						   height: 128,
						   texture: new Texture('rabbit.png')
						   });
var lettuceSkin = new Skin({width: 48,
						   height: 48,
						   texture: new Texture('lettuce.png')
						   });
var waterSkin = new Skin({width: 48,
						   height: 48,
						   texture: new Texture('water.png')
						   });
var haySkin = new Skin({width: 48,
						   height: 48,
						   texture: new Texture('hay.png')
						   });
var resourceButtonSkin = new Skin({width: 50, height: 50,borders:{left:2,right:2,top:0,bottom:0}, fill:"#fff"});
var resourceButtonSkinOnPress = new Skin({width: 50, height: 50,borders:{left:2,right:2,top:0,bottom:0}, fill:"#B8B8B8"});
var labelStyle = new Style( { font: "bold 40px", color:"white" } );
var updateLabelStyle = new Style( { font: "bold 30px", color:"white", horizontal: 'center', vertical: 'middle'} );
var buttonLabelStyle = new Style({font:"bold 20px", color:"white", horizontal: 'center', vertical: 'middle'});

Handler.bind("/discover", Behavior({
	onInvoke: function(handler, message){
		deviceURL = JSON.parse(message.requestText).url;
		if (hasFoundDevice()){
			 handler.invoke(new Message("/foundServerDialog"));
			 handler.invoke(new Message("/getStatus"));
		 	 resourceChart.invoke(new Message("/getResources"));
	    }
		else
			handler.invoke(new Message("/noServerWarning"));
	}
}));

Handler.bind("/forget", Behavior({
	onInvoke: function(handler, message){
		deviceURL = "";
	}
}));
//taken from dialog project
Handler.bind("/busy", Object.create(MODEL.DialogBehavior.prototype, {
	onDescribe: { value: 
		function(query) {
			return {
                    Dialog: DIALOG.Box,
                    title: "Fetching New Profile Picture!",
                    items: [
                        {
                            Item: DIALOG.Spinner, 
                        },
               
                    ],
                    cancel: "Cancel",
                };
		},
	},
}));

Handler.bind("/sleepWarning", Object.create(MODEL.DialogBehavior.prototype, {
	onDescribe: { value: 
		function(query) {
			return {
                    Dialog: DIALOG.Box,
                    title: "Rabbit Care Notification",
                    items: [
                        {
                        	Item: DIALOG.Comment,
                            string: "Taking pictures will be disabled for now because your rabbit is sleeping. It needs some peace and quiet just as much as you!" 
                        },
               
                    ],
                    ok: "Ok Disable Camera"
                };
		},
	},
}));

Handler.bind("/noServerWarning", Object.create(MODEL.DialogBehavior.prototype, {
	onDescribe: { value: 
		function(query) {
			return {
                    Dialog: DIALOG.Box,
                    title: "Rabbit Care Notification",
                    items: [
                        {
                        	Item: DIALOG.Comment,
                            string: "The Rabbit Care Server seems to be offline. Please try and fetch updates again soon!" 
                        },
               
                    ],
                    ok: "Ok"
                };
		},
	},
}));

Handler.bind("/foundServerDialog", Object.create(MODEL.DialogBehavior.prototype, {
	onDescribe: { value: 
		function(query) {
			return {
                    Dialog: DIALOG.Box,
                    title: "Rabbit Care Notification",
                    items: [
                        {
                        	Item: DIALOG.Comment,
                            string: "Syncing With Rabbit Care Server Now!" 
                        },
               
                    ],
                    ok: "Ok"
                };
		},
	},
}));


Handler.bind("/getResources", {
    onInvoke: function(handler, message){
        if (hasFoundDevice()) handler.invoke(new Message(deviceURL + "getResources"), Message.JSON);
    },
    onComplete: function(handler, message, json){
    	if(json){
	         demoData[0] = Math.round(Number(json.water)/20);
			 demoData[1] = Number(json.lettuce)*25;
			 demoData[2] = Number(json.hay)*10;
			 resourceChart.first.behavior.update();
	         handler.invoke( new Message("/delay"));
         }
    }
});

Handler.bind("/delay", {
    onInvoke: function(handler, message){
        handler.wait(1000); //will call onComplete after 1 seconds
    },
    onComplete: function(handler, message){
        handler.invoke(new Message("/getResources"));
    }
});

Handler.bind("/getStatus", {
    onInvoke: function(handler, message){
        if (hasFoundDevice()) handler.invoke(new Message(deviceURL + "getStatus"), Message.JSON);
    },
    onComplete: function(handler, message, json){
    	if(json){
    		statusLabel.string = json.status;
			if(statusLabel.string !="Asleep" && pictureButton.skin != cameraLoadingSkin){
				cameraDisabled = false;
				pictureButton.skin = cameraSkin;
			}
         handler.invoke( new Message("/delay2"));
         }
    }
});

Handler.bind("/delay2", {
    onInvoke: function(handler, message){
        handler.wait(1000); //will call onComplete after 1 seconds
    },
    onComplete: function(handler, message){
        handler.invoke(new Message("/getStatus"));
    }
});

function hasFoundDevice(){
	return deviceURL != "";
}

var shutterSound = new Sound( mergeURI( application.url, "Shutter-02.wav" ) );
var titleLabel = new Label({left:20, height:40, string:"Rabbit Care", style: labelStyle});

var pictureButtonTemplate = BUTTONS.Button.template(function($){ return{
	left:20, right: 0, height:30, skin: cameraSkin,
	contents: [
		new Label({left:0, right:0, height:20, string:"", style: buttonLabelStyle})
	],
	behavior: Object.create(BUTTONS.ButtonBehavior.prototype, {
		onTap: { value: function(content){
		if(hasFoundDevice() && !cameraDisabled){
			content.skin = cameraLoadingSkin;
			shutterSound.play();
			content.invoke(new Message("/busy"));
			content.invoke(new Message(deviceURL + "takePicture"), Message.JSON);
		}else{
			content.skin = cameraDisabledSkin;
		}
		}},
		onComplete: { value: function(content, message, json){
			content.skin = cameraLoadingSkin;
			profilePicture.url = json.url;
			application.behavior.closeDialog();
			if(json.warning == true){
				content.invoke(new Message("/sleepWarning"));
				cameraDisabled = true;
			}
		}}
	})
}});

var pictureButton = new pictureButtonTemplate();

var profilePicture = new Picture({left:0,right:0,url: 'rabbit-copy.png', height:160});


var Screen = Container.template(function($) { return {
left:0, right:0, top:10, bottom:0, active:true,
contents: [
	Canvas($, { anchor:"CANVAS", left:5, right:5, top:0, bottom:0,active:true,
		behavior: Object.create(Behavior.prototype, {
			onCreate: {value: function(canvas, data) {
				this.data = data;
				this.update = function(){
					/*As of 01/22/2015 this must be called between screen redraws or 
				    	 * the display will not update properly
				    	 */
					info.canvas.getContext("2d");
					graph.refresh(demoData);
				}			
			}},
			onDisplaying: { value: function(canvas) {
				graph = new CHART.BarGraph(canvas.getContext("2d"), 
						{primaryColors: ["#0EBFE9","#76EE00","#FFD700"], background: 'black', marginWidth: 20, skipBars: 1});
				info.ctx = canvas.getContext("2d");
				info.canvas = canvas;
			}},
 		   onTouchEnded: { value: function(container, id, x,  y, ticks) {	        			   
	    		//container.invoke(new Message("/getResources"));
		   }}
		   
		}),
	})
	]
}});

var resourceChart = new Screen({});
var statusLabel = new Label({left:0, right:0, height:40, string:"---", style: buttonLabelStyle});
var updateLabel = new Label({left:0, right:0, height:40, string:"---", style: buttonLabelStyle});
var ButtonTemplate = BUTTONS.Button.template(function($){ return{
	left: 0, right: 0, height:50,skin: resourceButtonSkin,
	contents: [
		new Label({left:0, right:0, height:50, name: $.name, string:"", skin: $.skin, style: labelStyle})
	],
	behavior: Object.create(BUTTONS.ButtonBehavior.prototype, {
		onTap: { value: function(content){
			content.skin = resourceButtonSkinOnPress;
			var resourcePath = "";
			switch(content.first.name){
			case "water":
				resourcePath = "addWater"; break;
			case "lettuce":
				resourcePath = "addLettuce"; break;
			case "hay":
				resourcePath = "addHay"; break;
			default:
				resourcePath = "reset";
			}
			content.invoke(new Message(deviceURL + resourcePath), Message.JSON);
		}},
		onComplete: { value: function(content, message, json){
			content.skin = resourceButtonSkin;
			if(message.status != 200)
				content.invoke(new Message("/noServerWarning"));
			else
				updateLabel.string = json.resource.toString();
		}}
	})
}});


var mainColumn = new Column({
	left: 0, right: 0, top: 0, bottom: 0, active: true, skin: whiteSkin,
	contents: [
		new Line({left:0, right:0,top:0,name: "headerLine",
			contents: [
				titleLabel, pictureButton
				
			]
		}),
		new Line({left:0, right:0,top:20,name: "contentLine",
			contents: [
				profilePicture
			]
		}),
		new Line({left:0, right:0,name: "infoLine",
			contents: [
				new Column({left:0, right:0, contents:[
					new Label({left:0, right:0, height:40, string:"Status", style: updateLabelStyle}),
					statusLabel,
				]}),
				new Column({left:0, right:0, contents:[
					new Label({left:0, right:0, height:40, string:"Updates", style: updateLabelStyle}),
					updateLabel
				]}),
				
			]
		}),
		new Line({left:0, right:0,height:150,name: "chartLine",
			contents: [
				resourceChart
			]
		}),
		new Line({left:0, right:0,top:0,height:50,name: "resourceLine",
			contents: [
				new ButtonTemplate({name:"water",skin: waterSkin}),
				new ButtonTemplate({name:"lettuce",skin: lettuceSkin}),
				new ButtonTemplate({name:"hay",skin: haySkin}),
			]
		}),
		
		
		
		
	]
});


var ApplicationBehavior = Behavior.template({
	_onScreenBegan: { value: "onScreenBegan", writable: false },
	_onScreenEnding: { value: "onScreenEnding", writable: false },
	_onScreenRotated: { value: "onScreenRotated", writable: false },
	onDisplayed: function(application) {
		application.discover("pet.feeder.device.app");
		this.dialog = null;
	},
	onQuit: function(application) {
		application.forget("pet.feeder.device.app");
	},
	openDialog: function(dialog) {
					if (this.dialog)
						this.closeDialog()
					this.dialog = dialog;
					application.run(new THEME.DialogOpenTransition, dialog);
			},
	closeDialog: function() {
			application.run(new THEME.DialogCloseTransition, this.dialog);
			this.dialog = null;
			if(!cameraDisabled && hasFoundDevice())
				pictureButton.skin = cameraSkin;
			else
				pictureButton.skin = cameraDisabledSkin;	
		}
})

application.behavior = new ApplicationBehavior();
application.add(mainColumn);